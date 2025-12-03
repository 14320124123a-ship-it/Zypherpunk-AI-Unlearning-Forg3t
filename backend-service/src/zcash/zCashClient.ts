import dotenv from 'dotenv';
import crypto from 'crypto';
import https from 'https';
import http from 'http';
import { URL } from 'url';

dotenv.config();

const CONFIG = {
  ZCASH_RPC_HOST: process.env.ZCASH_RPC_HOST || '127.0.0.1',
  ZCASH_RPC_PORT: parseInt(process.env.ZCASH_RPC_PORT || '18232'),
  ZCASH_RPC_USER: process.env.ZCASH_RPC_USER || 'zcashuser',
  ZCASH_RPC_PASSWORD: process.env.ZCASH_RPC_PASSWORD || 'zcashpass',
  ZCASH_NETWORK: process.env.ZCASH_NETWORK || 'testnet',
  ZCASH_SENDER_ADDRESS: process.env.ZCASH_SENDER_ADDRESS || 'utest1rvndnkhh6q0fewcd4qln7af6upk85xhq2x66wnlql86euzm4gx86x365vpua3x2ezczgzrsheup9nezkw0agdyd5a9pj7cfay0gmcm5fuw65hj2js665pfnhlxxmctpgyp72q9e54nsxqyfeauaa75vmme32hp32sewp057h9rsxxqgyfg4w7xe3lrnvw0t324s929rr9e096f3l957'
};

export interface UnlearningProofMeta {
  proofHash: string;
  modelId?: string;
  requestId?: string;
  userId?: string;
  timestamp?: string;
  extra?: Record<string, unknown>;
}

async function callZcashRpc<T>(method: string, params: any[] = []): Promise<T> {
  const url = new URL(`http://${CONFIG.ZCASH_RPC_HOST}:${CONFIG.ZCASH_RPC_PORT}`);
  
  const postData = JSON.stringify({
    jsonrpc: '1.0',
    id: crypto.randomBytes(16).toString('hex'),
    method,
    params
  });

  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Authorization': 'Basic ' + Buffer.from(`${CONFIG.ZCASH_RPC_USER}:${CONFIG.ZCASH_RPC_PASSWORD}`).toString('base64')
    }
  };

  return new Promise<T>((resolve, reject) => {
    const req = http.request(options, (res) => {
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
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Zcash RPC request timeout after 10 seconds'));
    });
    
    req.on('error', (err) => {
      reject(new Error(`Zcash RPC request failed: ${err instanceof Error ? err.message : 'Unknown error'}`));
    });
    
    req.write(postData);
    req.end();
  });
}

export async function getBlockchainInfo(): Promise<any> {
  try {
    return await callZcashRpc('getblockchaininfo');
  } catch (error) {
    console.error('Failed to get Zcash blockchain info:', error);
    throw error;
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    await callZcashRpc('getnetworkinfo');
    return true;
  } catch (error) {
    console.error('Zcash connection test failed:', error);
    return false;
  }
}

export async function sendUnlearningProofTx(meta: UnlearningProofMeta): Promise<string> {
  try {
    const memoPayload = {
      type: "forg3t_unlearning",
      proofHash: meta.proofHash,
      modelId: meta.modelId,
      requestId: meta.requestId,
      userId: meta.userId,
      timestamp: meta.timestamp ?? new Date().toISOString()
    };

    const memoString = JSON.stringify(memoPayload);
    const memoHex = Buffer.from(memoString, "utf8").toString("hex");
    
    if (memoHex.length > 1024) {
      throw new Error('Memo is too long for Zcash transaction');
    }

    const recipients = [{
      address: CONFIG.ZCASH_SENDER_ADDRESS,
      amount: 0.0001,
      memo: memoHex
    }];
    
    const opid = await callZcashRpc<string>('z_sendmany', [
      CONFIG.ZCASH_SENDER_ADDRESS,
      recipients
    ]);
    
    console.log(`Zcash transaction operation ID: ${opid}`);
    
    let txid: string | null = null;
    let attempts = 0;
    const maxAttempts = 60;
    
    while (!txid && attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      try {
        const operations = await callZcashRpc<any[]>('z_getoperationresult', [[opid]]);
        
        if (operations && operations.length > 0) {
          const operation = operations[0];
          if (operation.status === 'success') {
            txid = operation.result?.txid || null;
            break;
          } else if (operation.status === 'failed') {
            throw new Error(`Zcash transaction failed: ${operation.error?.message || 'Unknown error'}`);
          }
        }
        
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
    
    console.log(`Zcash transaction completed with ID: ${txid}`);
    return txid;
  } catch (error) {
    console.error('Failed to send Zcash unlearning proof transaction:', error);
    throw error;
  }
}