#!/usr/bin/env ts-node
import dotenv from 'dotenv';
import { recordUnlearningOnChains, UnlearningContext } from '../services/onchainUnlearningService';

dotenv.config();

async function sendTestUnlearningProof() {
  try {
    console.log('Sending test unlearning proof to both chains...');
    
    const context: UnlearningContext = {
      jobId: 'test-job-' + Date.now(),
      modelId: 'test-model-123',
      requestId: 'test-request-456',
      userId: 'test-user-789',
      timestamp: new Date()
    };
    
    console.log('Test context:', JSON.stringify(context, null, 2));
    
    const result = await recordUnlearningOnChains(context);
    
    console.log('=====================================');
    console.log('Test Unlearning Proof Results');
    console.log('=====================================');
    
    if (result.starknetTxHash) {
      console.log(`Starknet Transaction Hash: ${result.starknetTxHash}`);
    } else {
      console.log('Starknet Transaction: FAILED');
    }
    
    if (result.zcashTxId) {
      console.log(`Zcash Transaction ID: ${result.zcashTxId}`);
    } else {
      console.log('Zcash Transaction: FAILED');
    }
    
    if (result.error) {
      console.log(`Errors: ${result.error}`);
    }
    
    console.log('=====================================');
  } catch (error) {
    console.error('Error sending test unlearning proof:', error);
    process.exit(1);
  }
}

sendTestUnlearningProof();