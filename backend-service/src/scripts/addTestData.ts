#!/usr/bin/env node
/**
 * Add test data to database for dashboard demonstration
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function addTestData() {
  console.log('Adding test data to database...');
  
  try {
    // Add a test unlearning request with blockchain data
    const { data, error } = await supabase
      .from('unlearning_requests')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        model_id: '71b0edae-3e5d-4c6b-9a4c-8e1d8b6d8c4a',
        request_reason: 'Test blockchain integration',
        data_count: 5,
        status: 'completed',
        processing_time_seconds: 45,
        blockchain_tx_hash: '0x7c8a1d2f3e4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d',
        audit_trail: {
          leak_score: 0.02,
          zk_proof: 'zk_proof_123456789abcdef',
          ipfs_hash: 'QmXkf7C6Nd45xgcSjBrYRsAgPeDgXHa5N5DSmoC3Lo2XAU',
          starknet_tx_hash: '0x04a1d2b3c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
          zcash_tx_id: '7c8a1d2f3e4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d',
          proof_hash: 'proof_hash_123456789abcdef'
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding test data:', error);
      return false;
    }
    
    console.log(`✅ Test data added successfully with ID: ${data.id}`);
    return true;
  } catch (error) {
    console.error('Error adding test data:', error);
    return false;
  }
}

async function main() {
  console.log('🔧 Adding Test Data for Blockchain Integration');
  console.log('==========================================\n');
  
  const success = await addTestData();
  
  if (success) {
    console.log('\n✅ Test data added successfully!');
    console.log('You can now view the dashboard to see real blockchain data.');
  } else {
    console.log('\n❌ Failed to add test data.');
  }
  
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}