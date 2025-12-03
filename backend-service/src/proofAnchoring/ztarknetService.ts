import { RpcProvider, Account, Contract, CallData, cairo } from 'starknet';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { FORG3T_UNLEARNING_REGISTRY_ABI } from '../starknet/abiLoader';

dotenv.config();

// Supabase client for storing proof anchor data
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CONFIG = {
  ZTARKNET_RPC_URL: process.env.ZTARKNET_RPC_URL || 'https://api.ztarknet.cash/rpc',
  STARKNET_REGISTRY_CONTRACT: process.env.STARKNET_REGISTRY_CONTRACT_ADDRESS || '0x074780159de36063c7560a170f5f3cdc4eb1405a7b574e1250998f69be4391c0',
  STARKNET_ACCOUNT_ADDRESS: process.env.STARKNET_ACCOUNT_ADDRESS || '0x07b3df7fc385a21ec33701978ed74ce292f933cba3caaeb12e6e0efed37b7f82',
  STARKNET_PRIVATE_KEY: process.env.STARKNET_PRIVATE_KEY || '',
};

const provider = new RpcProvider({ nodeUrl: CONFIG.ZTARKNET_RPC_URL });
const account = new Account(provider, CONFIG.STARKNET_ACCOUNT_ADDRESS, CONFIG.STARKNET_PRIVATE_KEY);

const registryContract = new Contract(
  FORG3T_UNLEARNING_REGISTRY_ABI,
  CONFIG.STARKNET_REGISTRY_CONTRACT,
  account
);

/**
 * Submit a proof hash to the ZTarknet L2 contract
 * @param proofHash The proof hash to submit
 * @returns Transaction hash and block number
 */
export async function submitL2Proof(proofHash: string, unlearningJobId: string): Promise<{ txHash: string; blockNumber: number }> {
  try {
    console.log(`Submitting proof hash to ZTarknet L2: ${proofHash}`);
    
    // Prepare the calldata for the push_proof function
    const callData = new CallData(FORG3T_UNLEARNING_REGISTRY_ABI);
    const calldata = callData.compile("push_proof", []);
    
    // Get nonce to avoid conflicts
    const nonce = await account.getNonce('latest');
    
    // Execute the transaction with a fixed fee to avoid estimation issues
    const maxFee = BigInt(1000000000000000); // 0.001 ETH in wei
    
    const { transaction_hash } = await account.execute({
      contractAddress: CONFIG.STARKNET_REGISTRY_CONTRACT,
      entrypoint: "push_proof",
      calldata: calldata
    }, undefined, {
      maxFee: maxFee,
      nonce: nonce
    });
    
    console.log(`ZTarknet L2 transaction submitted: ${transaction_hash}`);
    
    // Wait for transaction to be accepted
    const receipt: any = await provider.waitForTransaction(transaction_hash);
    
    const executionStatus = receipt.execution_status || (receipt as any).status;
    const finalityStatus = receipt.finality_status || (receipt as any).status;
    const blockNumber = Number(receipt.block_number || (receipt as any).block_hash) || 0;
    
    if (executionStatus === 'SUCCEEDED' || 
        finalityStatus === 'ACCEPTED_ON_L2' || 
        finalityStatus === 'ACCEPTED_ON_L1') {
      
      // Store the proof anchor data in Supabase
      const { error } = await supabase
        .from('proof_anchors')
        .upsert({
          unlearning_job_id: unlearningJobId,
          proof_hash: proofHash,
          l2_tx: transaction_hash,
          l2_block: blockNumber,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'unlearning_job_id'
        });
      
      if (error) {
        console.error('Failed to store proof anchor in Supabase:', error);
      }
      
      console.log(`ZTarknet L2 proof submission successful: ${transaction_hash}`);
      return { txHash: transaction_hash, blockNumber };
    } else {
      throw new Error(`Transaction failed with execution status: ${executionStatus}, finality status: ${finalityStatus}`);
    }
  } catch (error) {
    console.error('Error submitting proof to ZTarknet L2:', error);
    throw new Error(`Failed to submit proof to ZTarknet L2: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get the status of an L2 transaction
 * @param txHash The transaction hash
 * @returns Transaction status and receipt
 */
export async function getL2TransactionStatus(txHash: string) {
  try {
    console.log(`Getting ZTarknet L2 transaction status: ${txHash}`);
    const receipt: any = await provider.getTransactionReceipt(txHash);
    
    const executionStatus = receipt.execution_status || (receipt as any).status;
    const finalityStatus = receipt.finality_status || (receipt as any).status;
    const blockNumber = Number(receipt.block_number || (receipt as any).block_hash) || 0;
    
    return {
      status: executionStatus || finalityStatus,
      blockNumber: blockNumber,
      success: executionStatus === 'SUCCEEDED' || 
               finalityStatus === 'ACCEPTED_ON_L2' || 
               finalityStatus === 'ACCEPTED_ON_L1'
    };
  } catch (error) {
    console.error('Error getting L2 transaction status:', error);
    throw new Error(`Failed to get L2 transaction status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse L2 transaction hash from a transaction
 * @param txHash The transaction hash
 * @returns Parsed transaction information
 */
export function parseL2TransactionHash(txHash: string) {
  // Basic validation and parsing
  if (!txHash || !txHash.startsWith('0x')) {
    throw new Error('Invalid transaction hash format');
  }
  
  return {
    hash: txHash,
    shortHash: txHash.slice(0, 16) + '...',
    explorerUrl: `https://sepolia.starkscan.co/tx/${txHash}`
  };
}