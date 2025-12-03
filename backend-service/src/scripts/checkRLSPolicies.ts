import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Use service role key
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS Policies');
  console.log('======================');
  
  try {
    // Check if RLS is enabled on unlearning_requests table
    console.log('\n1. Checking RLS status on unlearning_requests table...');
    
    // We can't directly query the RLS policies through the Supabase client,
    // but we can check if we can bypass them by using raw SQL
    
    // Try to insert a record with a specific user_id
    console.log('\n2. Testing insert with specific user_id...');
    const testRecord = {
      user_id: '00000000-0000-0000-0000-000000000000',
      model_id: null,
      request_reason: 'RLS policy test',
      data_count: 1,
      status: 'completed',
      processing_time_seconds: 5,
      blockchain_tx_hash: null,
      audit_trail: {
        leak_score: 0.01,
        zk_proof: 'rls-test-proof',
        ipfs_hash: 'QmRLSTest'
      },
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('unlearning_requests')
      .insert([testRecord])
      .select();
      
    if (error) {
      console.log(`❌ Insert failed: ${error.message}`);
      console.log(`   This confirms RLS policies are active and blocking inserts`);
      
      // Check if we can read from the table
      console.log('\n3. Testing read access...');
      const { data: readData, error: readError } = await supabase
        .from('unlearning_requests')
        .select('id')
        .limit(1);
        
      if (readError) {
        console.log(`❌ Read failed: ${readError.message}`);
      } else {
        console.log(`✅ Read successful: ${readData?.length || 0} records found`);
      }
    } else {
      console.log(`✅ Insert successful - RLS policies may not be properly configured`);
      console.log(`   Record ID: ${data?.[0]?.id}`);
      
      // Clean up
      if (data?.[0]?.id) {
        await supabase
          .from('unlearning_requests')
          .delete()
          .eq('id', data[0].id);
        console.log('✅ Test record cleaned up');
      }
    }
    
    console.log('\n📋 Based on the RLS policies in setup.sql:');
    console.log('   - Users can only insert requests with their own user_id');
    console.log('   - Service role should be able to bypass these restrictions');
    console.log('   - The issue might be that the service role key isn\'t being used correctly');
    
  } catch (error) {
    console.error('❌ Error checking RLS policies:', error);
    process.exit(1);
  }
}

checkRLSPolicies();