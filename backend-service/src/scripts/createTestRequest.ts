#!/usr/bin/env ts-node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

async function createTestRequest() {
  try {
    // Use service role key which should bypass RLS
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('Checking for existing unlearning requests...');

    // First, let's check if there are any existing requests
    const { data: existingRequests, error: fetchError } = await supabase
      .from('unlearning_requests')
      .select('*')
      .limit(1);

    if (fetchError) {
      console.error('Error fetching existing requests:', fetchError);
      process.exit(1);
    }

    if (existingRequests && existingRequests.length > 0) {
      console.log('Found existing request, updating it with blockchain data...');
      
      const requestId = existingRequests[0].id;
      
      // Update the existing request with blockchain data
      const { data, error } = await supabase
        .from('unlearning_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          blockchain_tx_hash: '8278a7151d665651b37008cb9460a3e99a0a9458c4a38f5529958192d16986fb',
          audit_trail: {
            leak_score: 0.05,
            zk_proof: 'proof_' + Date.now().toString().slice(-8),
            ipfs_hash: 'Qm' + Math.random().toString(36).substring(2, 15),
            starknet_tx_hash: null, // Starknet failed in our test
            zcash_tx_id: '8278a7151d665651b37008cb9460a3e99a0a9458c4a38f5529958192d16986fb',
            onchain_error: 'Starknet RPC compatibility issue'
          },
          processing_time_seconds: 45,
          ipfs_hash: 'Qm' + Math.random().toString(36).substring(2, 15)
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error updating request:', error);
        process.exit(1);
      }

      console.log('Successfully updated existing request with blockchain data!');
      console.log('Request ID:', requestId);
    } else {
      console.log('No existing requests found. Creating a new test user and request...');
      
      // Create a test user first
      const userId = uuidv4();
      const userEmail = `testuser${Date.now()}@example.com`;
      
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userEmail,
          package_type: 'individual'
        });

      if (userError) {
        console.error('Error creating test user:', userError);
        // Continue anyway
      }

      // Create a new request
      const newRequest = {
        id: uuidv4(),
        model_id: uuidv4(),
        request_id: uuidv4(),
        user_id: userId,
        status: 'completed',
        prompt: 'Test prompt for unlearning',
        request_reason: 'Testing blockchain integration',
        data_count: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        blockchain_tx_hash: '8278a7151d665651b37008cb9460a3e99a0a9458c4a38f5529958192d16986fb',
        audit_trail: {
          leak_score: 0.05,
          zk_proof: 'proof_' + Date.now().toString().slice(-8),
          ipfs_hash: 'Qm' + Math.random().toString(36).substring(2, 15),
          starknet_tx_hash: null, // Starknet failed in our test
          zcash_tx_id: '8278a7151d665651b37008cb9460a3e99a0a9458c4a38f5529958192d16986fb',
          onchain_error: 'Starknet RPC compatibility issue'
        },
        processing_time_seconds: 45,
        ipfs_hash: 'Qm' + Math.random().toString(36).substring(2, 15)
      };

      const { error: insertError } = await supabase
        .from('unlearning_requests')
        .insert(newRequest);

      if (insertError) {
        console.error('Error creating new request:', insertError);
        process.exit(1);
      }

      console.log('Successfully created new test request with blockchain data!');
      console.log('Request ID:', newRequest.id);
    }
  } catch (error) {
    console.error('Error in createTestRequest:', error);
    process.exit(1);
  }
}

createTestRequest();