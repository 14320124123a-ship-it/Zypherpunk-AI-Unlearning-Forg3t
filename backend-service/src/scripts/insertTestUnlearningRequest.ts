#!/usr/bin/env ts-node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

async function insertTestUnlearningRequest() {
  try {
    // Use service role key which should bypass RLS
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('Fetching existing users...');

    // First, let's get an existing user
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      process.exit(1);
    }

    let userId: string;
    
    if (users && users.length > 0) {
      userId = users[0].id;
      console.log('Using existing user:', userId);
    } else {
      console.log('No existing users found. Please create a user through the app first.');
      process.exit(1);
    }

    console.log('Inserting test unlearning request...');

    // Create a test unlearning request
    const testRequest = {
      model_id: 'c1d2e3f4-g5h6-7890-abcd-ef1234567892',
      request_id: 'd1e2f3g4-h5i6-7890-abcd-ef1234567893',
      user_id: userId,
      status: 'completed',
      prompt: 'Test prompt for unlearning',
      request_reason: 'Testing blockchain integration',
      data_count: 5,
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      updated_at: new Date(Date.now() - 55 * 60 * 1000).toISOString(), // 55 minutes ago
      completed_at: new Date(Date.now() - 55 * 60 * 1000).toISOString(), // 55 minutes ago
      blockchain_tx_hash: '8278a7151d665651b37008cb9460a3e99a0a9458c4a38f5529958192d16986fb',
      audit_trail: {
        leak_score: 0.05,
        zk_proof: 'proof_test123',
        ipfs_hash: 'QmTestHash123',
        starknet_tx_hash: null, // Starknet failed in our test
        zcash_tx_id: '8278a7151d665651b37008cb9460a3e99a0a9458c4a38f5529958192d16986fb',
        onchain_error: 'Starknet RPC compatibility issue'
      },
      processing_time_seconds: 45,
      ipfs_hash: 'QmTestHash123'
    };

    const { data, error } = await supabase
      .from('unlearning_requests')
      .insert(testRequest)
      .select();

    if (error) {
      console.error('Error inserting test request:', error);
      process.exit(1);
    }

    console.log('Test unlearning request inserted successfully!');
    console.log('Request ID:', data[0].id);
  } catch (error) {
    console.error('Error in insertTestUnlearningRequest:', error);
    process.exit(1);
  }
}

insertTestUnlearningRequest();