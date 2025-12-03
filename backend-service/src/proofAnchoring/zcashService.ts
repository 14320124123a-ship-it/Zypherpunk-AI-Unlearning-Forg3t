import dotenv from 'dotenv';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase client for storing proof anchor data
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CONFIG = {
  ZCASH_REMOTE_RPC_URL: process.env.ZCASH_REMOTE_RPC_URL || '',
  ZCASH_RPC_USER: process.env.ZCASH_RPC_USER || 'zcashuser',
  ZCASH_RPC_PASSWORD: process.env.ZCASH_RPC_PASSWORD || 'zcashpass',
  ZCASH_SENDER_ADDRESS: process.env.ZCASH_SENDER_ADDRESS || ''
};

if (!CONFIG.ZCASH_REMOTE_RPC_URL) {
  console.warn('Warning: ZCASH_REMOTE_RPC_URL is not set. L1 proof anchoring will not work.');
}

/**
 * Send a Zcash RPC request through the Cloudflare tunnel
 * @param method The RPC method to call
 * @param params The parameters for the RPC method
 * @returns The result of the RPC call
 */
async function callZcashRpc<T>(method: string, params: any[] = []): Promise<T> {
  if (!CONFIG.ZCASH_REMOTE_RPC_URL) {
    throw new Error('ZCASH_REMOTE_RPC_URL is not configured');
  }

  const url = new URL(CONFIG.ZCASH_REMOTE_RPC_URL);
  
  const postData = JSON.stringify({
    jsonrpc: '1.0',
    id: Math.random().toString(36).substring(7),
    method,
    params
  });

  // Determine if we should use HTTPS or HTTP based on the URL
  const isHttps = url.protocol === 'https:';
  const client = isHttps ? https : http;

  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Authorization': 'Basic ' + Buffer.from(`${CONFIG.ZCASH_RPC_USER}:${CONFIG.ZCASH_RPC_PASSWORD}`).toString('base64')
    }
  };

  return new Promise<T>((resolve, reject) => {
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.error) {
            reject(new Error(`Zcash RPC error: ${response.error.message} (code: ${response.error.code})`));
          } else {
            resolve(response.result);
          }
        } catch (err) {
          reject(new Error(`Failed to parse Zcash RPC response: ${err instanceof Error ? err.message : 'Unknown error'}. Response: ${data}`));
        }
      });
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Zcash RPC request timeout after 30 seconds'));
    });
    
    req.on('error', (err) => {
      reject(new Error(`Zcash RPC request failed: ${err instanceof Error ? err.message : 'Unknown error'}`));
    });
    
    req.write(postData);
    req.end();
  });
}

/**
 * Create a TZE transaction with the proof hash embedded in the memo
 * @param proofHash The proof hash to embed in the transaction
 * @param unlearningJobId The ID of the unlearning job
 * @returns Transaction hash and block height
 */
export async function submitL1Proof(proofHash: string, unlearningJobId: string): Promise<{ txHash: string; blockHeight: number }> {
  try {
    console.log(`Submitting proof hash to Zcash L1: ${proofHash}`);
    
    // Create a memo with the proof hash
    const memoPayload = {
      type: "forg3t_unlearning_proof",
      proofHash: proofHash,
      jobId: unlearningJobId,
      timestamp: new Date().toISOString()
    };

    const memoString = JSON.stringify(memoPayload);
    const memoHex = Buffer.from(memoString, "utf8").toString("hex");
    
    if (memoHex.length > 512) {
      throw new Error('Memo is too long for Zcash transaction');
    }

    // Create a transaction to ourselves with a small amount and the memo
    const recipients = [{
      address: CONFIG.ZCASH_SENDER_ADDRESS,
      amount: 0.0001, // Small amount to cover fees
      memo: memoHex
    }];
    
    // Send the transaction using z_sendmany
    const opid = await callZcashRpc<string>('z_sendmany', [
      CONFIG.ZCASH_SENDER_ADDRESS,
      recipients
    ]);
    
    console.log(`Zcash transaction operation ID: ${opid}`);
    
    // Poll for transaction completion
    let txid: string | null = null;
    let blockHeight: number = 0;
    let attempts = 0;
    const maxAttempts = 60; // Wait up to 10 minutes (60 * 10 seconds)
    
    while (!txid && attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      try {
        const operations = await callZcashRpc<any[]>('z_getoperationresult', [[opid]]);
        
        if (operations && operations.length > 0) {
          const operation = operations[0];
          if (operation.status === 'success') {
            txid = operation.result?.txid || null;
            // Get block height if available
            if (operation.result?.blockheight) {
              blockHeight = operation.result.blockheight;
            }
            break;
          } else if (operation.status === 'failed') {
            throw new Error(`Zcash transaction failed: ${operation.error?.message || 'Unknown error'}`);
          }
        }
        
        // Log status for debugging
        const status = await callZcashRpc<any[]>('z_getoperationstatus', [[opid]]);
        if (status && status.length > 0) {
          console.log(`Zcash operation status: ${status[0].status}`);
        }
      } catch (err) {
        console.warn(`Attempt ${attempts}: Failed to check Zcash operation status, retrying...`, err);
      }
    }
    
    if (!txid) {
      throw new Error('Zcash transaction did not complete within the expected time');
    }
    
    // Store the proof anchor data in Supabase
    const { error } = await supabase
      .from('proof_anchors')
      .upsert({
        unlearning_job_id: unlearningJobId,
        proof_hash: proofHash,
        l1_tx: txid,
        l1_block: blockHeight,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'unlearning_job_id'
      });
    
    if (error) {
      console.error('Failed to store proof anchor in Supabase:', error);
    }
    
    console.log(`Zcash L1 proof submission successful: ${txid}`);
    return { txHash: txid, blockHeight };
  } catch (error) {
    console.error('Error submitting proof to Zcash L1:', error);
    throw new Error(`Failed to submit proof to Zcash L1: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get the status of an L1 transaction
 * @param txHash The transaction hash
 * @returns Transaction status and block information
 */
export async function getL1TransactionStatus(txHash: string) {
  try {
    console.log(`Getting Zcash L1 transaction status: ${txHash}`);
    
    // Get transaction details
    const txDetails = await callZcashRpc<any>('gettransaction', [txHash]);
    
    // Get block details if confirmed
    let blockHeight = 0;
    if (txDetails.blockhash) {
      const block = await callZcashRpc<any>('getblock', [txDetails.blockhash]);
      blockHeight = block.height;
    }
    
    return {
      status: txDetails.confirmations > 0 ? 'confirmed' : 'pending',
      confirmations: txDetails.confirmations || 0,
      blockHeight: blockHeight,
      success: txDetails.confirmations > 0
    };
  } catch (error) {
    console.error('Error getting L1 transaction status:', error);
    throw new Error(`Failed to get L1 transaction status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse L1 transaction hash
 * @param txHash The transaction hash
 * @returns Parsed transaction information
 */
export function parseL1TransactionHash(txHash: string) {
  // Basic validation
  if (!txHash) {
    throw new Error('Invalid transaction hash');
  }
  
  return {
    hash: txHash,
    shortHash: txHash.slice(0, 16) + '...',
    explorerUrl: `https://zcashblockexplorer.com/transactions/${txHash}`
  };
}