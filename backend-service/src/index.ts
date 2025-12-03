import { createClient } from '@supabase/supabase-js';
import { 
  RpcProvider, 
  Account, 
  cairo,
  CallData,
  Contract
} from 'starknet';
import { Client as ZcashClient, AssetZEC } from '@xchainjs/xchain-zcash';
import { assetToString, baseAmount } from '@xchainjs/xchain-util';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { onUnlearningSuccess } from './services/unlearningRegistryService';
import { registerUnlearningProof } from './starknet/starknetClient';
import { recordUnlearningOnChains, UnlearningContext } from './services/onchainUnlearningService';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CONFIG = {
  L2_RPC_ENDPOINT: process.env.STARKNET_RPC_URL || `https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/${process.env.ALCHEMY_API_KEY}`,
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || '0x02f797a15292f9859f7d5fb76847b41bbd2778c35570f68af8e25a669c16bf3d',
  STARKNET_ACCOUNT_ADDRESS: process.env.STARKNET_ACCOUNT_ADDRESS || '0x07b3df7fc385a21ec33701978ed74ce292f933cba3caaeb12e6e0efed37b7f82',
  STARKNET_PRIVATE_KEY: process.env.STARKNET_PRIVATE_KEY!,
  L1_RPC_ENDPOINT: process.env.L1_RPC_ENDPOINT || 'http://localhost:18232',
  ZCASH_WALLET_MNEMONIC: process.env.ZCASH_WALLET_MNEMONIC || 'equip will roof matter pink blind book anxiety banner elbow sun young',
  ZCASH_WALLET_INDEX: parseInt(process.env.ZCASH_WALLET_INDEX || '0'),
  POLL_INTERVAL: 5000,
};

const provider = new RpcProvider({ nodeUrl: CONFIG.L2_RPC_ENDPOINT });
const account = new Account(provider, CONFIG.STARKNET_ACCOUNT_ADDRESS, CONFIG.STARKNET_PRIVATE_KEY);

let zcashClient: any;
try {
  zcashClient = new ZcashClient();
  zcashClient.setPhrase(CONFIG.ZCASH_WALLET_MNEMONIC);
} catch (error) {
  console.error('Error initializing Zcash client:', error);
  zcashClient = new ZcashClient({
    phrase: CONFIG.ZCASH_WALLET_MNEMONIC
  } as any);
}

try {
  if (typeof zcashClient.setClientUrl === 'function') {
    zcashClient.setClientUrl(CONFIG.L1_RPC_ENDPOINT);
  } else {
    zcashClient.clientUrl = CONFIG.L1_RPC_ENDPOINT;
  }
} catch (error) {
  console.error('Error setting Zcash client URL:', error);
  try {
    zcashClient.config = {
      ...zcashClient.config,
      clientUrl: CONFIG.L1_RPC_ENDPOINT
    };
  } catch (fallbackError) {
    console.error('Error setting Zcash client URL with fallback:', fallbackError);
  }
}

function computeProofHash(unlearningRequest: any): string {
  console.log(`Computing proof hash for job ${unlearningRequest.id}`);
  
  const input = `${unlearningRequest.id}-${unlearningRequest.created_at}-${JSON.stringify(unlearningRequest.audit_trail || {})}`;
  
  const hash = crypto.createHash('sha256').update(input).digest('hex');
  
  const feltHash = `0x${hash.slice(0, 62)}`;
  
  console.log(`Computed proof hash: ${feltHash}`);
  return feltHash;
}

async function storeProofOnL2(jobId: string, proofHash: string): Promise<string> {
  console.log(`Storing proof on L2 for job ${jobId}`);
  console.log(`Proof hash: ${proofHash}`);
  
  try {
    const jobIdFelt = jobId.length > 62 ? 
      `0x${crypto.createHash('sha256').update(jobId).digest('hex').slice(0, 62)}` : 
      `0x${Buffer.from(jobId).toString('hex')}`;
    
    const proofHashFelt = proofHash;
    
    const contractCall = {
      contractAddress: CONFIG.CONTRACT_ADDRESS,
      entrypoint: 'store_proof',
      calldata: CallData.compile({
        job_id: cairo.felt(jobIdFelt),
        proof_hash: cairo.felt(proofHashFelt)
      })
    };
    
    console.log('Sending transaction to Starknet contract...');
    
    const { transaction_hash } = await account.execute(contractCall);
    
    console.log(`L2 transaction submitted with hash: ${transaction_hash}`);
    
    console.log('Waiting for transaction to be accepted on L2...');
    const result: any = await provider.waitForTransaction(transaction_hash);
    
    if ('execution_status' in result && result.execution_status === 'SUCCEEDED') {
      console.log(`L2 transaction accepted: ${transaction_hash}`);
      return transaction_hash;
    } else if ('status' in result && (result.status === 'ACCEPTED_ON_L2' || result.status === 'ACCEPTED_ON_L1')) {
      console.log(`L2 transaction accepted: ${transaction_hash}`);
      return transaction_hash;
    } else {
      const status = 'execution_status' in result ? result.execution_status : ('status' in result ? result.status : 'UNKNOWN');
      throw new Error(`Transaction failed with status: ${status}`);
    }
  } catch (error: any) {
    console.error(`Error storing proof on L2:`, error);
    throw error;
  }
}

async function createZcashTransaction(proofHash: string): Promise<string> {
  console.log(`Creating Zcash transaction with embedded proof hash: ${proofHash}`);
  
  try {
    const address = zcashClient.getAddress();
    console.log(`Using wallet address: ${address}`);
    
    const balances = await zcashClient.getBalance(address);
    const zecBalance = balances.find((b: any) => assetToString(b.asset) === 'ZEC');
    
    if (!zecBalance || zecBalance.amount.amount().lt(baseAmount(10000, 8).amount())) {
      throw new Error(`Insufficient ZEC balance. Current balance: ${zecBalance ? zecBalance.amount.amount().toString() : '0'}`);
    }
    
    console.log(`Current ZEC balance: ${zecBalance.amount.amount().toString()}`);
    
    const amount = baseAmount(10000, 8);
    const fee = baseAmount(1000, 8);
    
    const txHash = await zcashClient.transfer({
      asset: AssetZEC,
      amount: amount,
      recipient: address,
      memo: `proof:${proofHash}`
    });
    
    console.log(`Zcash transaction created with hash: ${txHash}`);
    return txHash;
  } catch (error: any) {
    console.error(`Error creating Zcash transaction:`, error);
    throw error;
  }
}

async function logUnlearningProof(jobId: string, userId: string | undefined, requestId: string | undefined, txHash: string) {
  try {
    const { error } = await supabase
      .from('unlearning_proof_log')
      .insert({
        job_id: jobId,
        user_id: userId,
        request_id: requestId,
        registry_tx_hash: txHash,
        operation_timestamp: new Date()
      });
    
    if (error) {
      console.error(`Failed to log unlearning proof for job ${jobId}:`, error);
    } else {
      console.log(`Successfully logged unlearning proof for job ${jobId} with tx hash ${txHash}`);
    }
  } catch (error) {
    console.error(`Error logging unlearning proof for job ${jobId}:`, error);
  }
}

async function processCompletedJob(job: any) {
  try {
    console.log(`Processing completed job: ${job.id}`);
    
    const context: UnlearningContext = {
      jobId: job.id,
      modelId: job.model_id,
      requestId: job.request_id,
      userId: job.user_id,
      timestamp: new Date()
    };
    
    const onchainResult = await recordUnlearningOnChains(context);
    
    if (onchainResult.starknetTxHash) {
      console.log(`[Forg3t][Onchain] Starknet tx: ${onchainResult.starknetTxHash}`);
    }
    
    if (onchainResult.zcashTxId) {
      console.log(`[Forg3t][Onchain] Zcash tx: ${onchainResult.zcashTxId}`);
    }
    
    if (onchainResult.error) {
      console.error(`[Forg3t][Onchain] Errors occurred: ${onchainResult.error}`);
    }
    
    const { error } = await supabase
      .from('unlearning_requests')
      .update({
        blockchain_tx_hash: onchainResult.zcashTxId || null,
        audit_trail: {
          ...job.audit_trail,
          starknet_tx_hash: onchainResult.starknetTxHash || null,
          zcash_tx_id: onchainResult.zcashTxId || null,
          onchain_error: onchainResult.error || null
        }
      })
      .eq('id', job.id);
    
    if (error) {
      console.error(`Failed to update job ${job.id}:`, error);
    } else {
      console.log(`Successfully updated job ${job.id} with onchain transaction hashes`);
      
      if (onchainResult.starknetTxHash) {
        await logUnlearningProof(job.id, job.user_id, job.request_id, onchainResult.starknetTxHash);
      }
    }
  } catch (error: any) {
    console.error(`Error processing job ${job.id}:`, error);
    
    try {
      const { error: updateError } = await supabase
        .from('unlearning_requests')
        .update({
          audit_trail: {
            ...job.audit_trail,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })
        .eq('id', job.id);
      
      if (updateError) {
        console.error(`Failed to update job ${job.id} with error info:`, updateError);
      }
    } catch (updateError: any) {
      console.error(`Failed to record error for job ${job.id}:`, updateError);
    }
  }
}

async function checkForCompletedJobs() {
  console.log('Checking for completed unlearning jobs...');
  
  try {
    const { data: jobs, error } = await supabase
      .from('unlearning_requests')
      .select('*')
      .eq('status', 'completed');
      // Removed the filter for blockchain_tx_hash being null to process all completed jobs
    
    if (error) {
      console.error('Error fetching completed jobs:', error);
      return;
    }
    
    console.log(`Found ${jobs.length} completed jobs to process`);
    
    for (const job of jobs) {
      // Only process jobs that haven't been processed yet (check if audit_trail has blockchain info)
      if (!job.audit_trail || 
          (!job.audit_trail.starknet_tx_hash && 
           !job.audit_trail.zcash_tx_id && 
           !job.audit_trail.l2_tx_id && 
           !job.audit_trail.l1_tze_tx_id)) {
        await processCompletedJob(job);
      }
    }
  } catch (error: any) {
    console.error('Error checking for completed jobs:', error);
  }
}

async function main() {
  console.log('Starting Forg3t Protocol - StarkNet Sepolia Integration Service...');
  console.log(`Supabase URL: ${process.env.SUPABASE_URL}`);
  console.log(`L2 RPC Endpoint: ${CONFIG.L2_RPC_ENDPOINT}`);
  console.log(`Contract Address: ${CONFIG.CONTRACT_ADDRESS}`);
  console.log(`Account Address: ${CONFIG.STARKNET_ACCOUNT_ADDRESS}`);
  console.log(`L1 RPC Endpoint: ${CONFIG.L1_RPC_ENDPOINT}`);
  console.log(`Zcash Wallet Address: ${zcashClient.getAddress()}`);
  
  await checkForCompletedJobs();
  
  setInterval(checkForCompletedJobs, CONFIG.POLL_INTERVAL);
  
  console.log(`Polling for completed jobs every ${CONFIG.POLL_INTERVAL}ms`);
}

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});

main().catch(console.error);