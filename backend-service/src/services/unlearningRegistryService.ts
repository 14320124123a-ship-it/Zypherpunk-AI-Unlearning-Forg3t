import { registerUnlearningProof } from '../starknet/starknetClient';

export interface UnlearningContext {
  jobId: string;
  userId?: string;
  modelId?: string;
  requestId?: string;
  timestamp: Date;
  [key: string]: any;
}

export async function onUnlearningSuccess(context: UnlearningContext): Promise<{ txHash: string }> {
  try {
    console.log(`Registering unlearning success for job ${context.jobId} on Starknet registry`);
    
    // Register the unlearning proof on Starknet
    const result = await registerUnlearningProof();
    
    console.log(`Successfully registered unlearning proof for job ${context.jobId} with transaction hash: ${result.txHash}`);
    
    return result;
  } catch (error) {
    console.error(`Failed to register unlearning proof for job ${context.jobId} on Starknet:`, error);
    throw error;
  }
}