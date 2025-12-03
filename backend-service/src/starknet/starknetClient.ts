import { RpcProvider, Account, Contract, CallData } from 'starknet';
import dotenv from 'dotenv';
import { FORG3T_UNLEARNING_REGISTRY_ABI } from './abiLoader';

dotenv.config();

const CONFIG = {
  STARKNET_RPC_URL: process.env.STARKNET_RPC_URL || 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/21xJKr6s7H7ynN5UxElPx',
  STARKNET_REGISTRY_CONTRACT: process.env.STARKNET_REGISTRY_CONTRACT_ADDRESS || '0x074780159de36063c7560a170f5f3cdc4eb1405a7b574e1250998f69be4391c0',
  STARKNET_ACCOUNT_ADDRESS: process.env.STARKNET_ACCOUNT_ADDRESS || '0x07b3df7fc385a21ec33701978ed74ce292f933cba3caaeb12e6e0efed37b7f82',
  STARKNET_PRIVATE_KEY: process.env.STARKNET_PRIVATE_KEY || '',
  STARKNET_BLOCK_ID: process.env.STARKNET_BLOCK_ID || 'latest'
};

const provider = new RpcProvider({ nodeUrl: CONFIG.STARKNET_RPC_URL });
const account = new Account(provider, CONFIG.STARKNET_ACCOUNT_ADDRESS, CONFIG.STARKNET_PRIVATE_KEY);

const registryContractRead = new Contract(
  FORG3T_UNLEARNING_REGISTRY_ABI,
  CONFIG.STARKNET_REGISTRY_CONTRACT,
  provider
);

export async function getProofCount(): Promise<bigint> {
  try {
    const result = await provider.callContract({
      contractAddress: CONFIG.STARKNET_REGISTRY_CONTRACT,
      entrypoint: "get_proof_count",
      calldata: []
    }, CONFIG.STARKNET_BLOCK_ID);
    
    return BigInt(result[0]);
  } catch (error) {
    console.error('Error getting proof count:', error);
    throw new Error(`Failed to get proof count: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function registerUnlearningProof(): Promise<{ txHash: string }> {
  try {
    const callData = new CallData(FORG3T_UNLEARNING_REGISTRY_ABI);
    const calldata = callData.compile("push_proof", []);
    
    const feeEstimate = await account.estimateInvokeFee({
      contractAddress: CONFIG.STARKNET_REGISTRY_CONTRACT,
      entrypoint: "push_proof",
      calldata: calldata
    });
    
    const { transaction_hash } = await account.execute({
      contractAddress: CONFIG.STARKNET_REGISTRY_CONTRACT,
      entrypoint: "push_proof",
      calldata: calldata
    }, undefined, {
      maxFee: feeEstimate.suggestedMaxFee,
      nonce: await account.getNonce(CONFIG.STARKNET_BLOCK_ID)
    });
    
    console.log(`Unlearning proof registration submitted with transaction hash: ${transaction_hash}`);
    
    const result = await provider.waitForTransaction(transaction_hash);
    
    if (result.execution_status === 'SUCCEEDED') {
      console.log(`Unlearning proof registration accepted: ${transaction_hash}`);
      return { txHash: transaction_hash };
    } else {
      throw new Error(`Transaction failed with status: ${result.execution_status}`);
    }
  } catch (error) {
    console.error('Error registering unlearning proof:', error);
    if (error instanceof Error && error.message.includes('Invalid block id')) {
      throw new Error(`Starknet RPC compatibility issue: ${error.message}. This is a known issue with certain RPC endpoints.`);
    }
    throw new Error(`Failed to register unlearning proof: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}