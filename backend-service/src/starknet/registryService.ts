import { registerUnlearningProof, getProofCount } from './starknetClient';
import dotenv from 'dotenv';

dotenv.config();

export interface UnlearningContext {
  jobId: string;
  userId?: string;
  modelId?: string;
  requestId?: string;
  timestamp: Date;
  [key: string]: any;
}

interface RegistryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  exponentialBase?: number;
}

const DEFAULT_OPTIONS: RegistryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  exponentialBase: 2
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateRetryDelay(attempt: number, options: RegistryOptions): number {
  const delay = Math.min(
    options.initialDelayMs! * Math.pow(options.exponentialBase!, attempt),
    options.maxDelayMs!
  );
  
  const jitter = Math.random() * 0.1 * delay;
  return delay + jitter;
}

export async function onUnlearningSuccess(context: UnlearningContext, options: RegistryOptions = {}): Promise<{ txHash: string }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  for (let attempt = 0; attempt <= opts.maxRetries!; attempt++) {
    try {
      console.log(`Attempt ${attempt + 1} to register unlearning success for job ${context.jobId} on Starknet registry`);
      
      // Register the unlearning proof on Starknet
      const result = await registerUnlearningProof();
      
      console.log(`Successfully registered unlearning proof for job ${context.jobId} with transaction hash: ${result.txHash}`);
      
      return result;
    } catch (error) {
      console.error(`Failed to register unlearning proof for job ${context.jobId} on Starknet (attempt ${attempt + 1}):`, error);
      
      if (attempt === opts.maxRetries) {
        throw new Error(`Failed to register unlearning proof after ${opts.maxRetries! + 1} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      const delay = calculateRetryDelay(attempt, opts);
      console.log(`Waiting ${delay}ms before retrying...`);
      
      await sleep(delay);
    }
  }
  throw new Error('Unexpected error in onUnlearningSuccess');
}

export async function getCurrentProofCount(): Promise<bigint> {
  return await getProofCount();
}