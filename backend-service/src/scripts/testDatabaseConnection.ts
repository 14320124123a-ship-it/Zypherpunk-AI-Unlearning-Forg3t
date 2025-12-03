import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

console.log('🔍 Testing Database Connection and Permissions');
console.log('===========================================');

// Test with anonymous key (frontend approach)
console.log('\n1. Testing with Anonymous Key (Frontend Approach)...');
const supabaseAnon = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Using the same key as frontend
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

// Test with service role key (backend approach)
console.log('\n2. Testing with Service Role Key (Backend Approach)...');
const supabaseService = createClient(
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

async function testConnections() {
  try {
    // Test anonymous connection
    console.log('\n--- Anonymous Connection Test ---');
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('unlearning_requests')
      .select('id')
      .limit(1);
      
    if (anonError) {
      console.log(`❌ Anonymous connection failed: ${anonError.message}`);
      console.log(`   Code: ${anonError.code}`);
    } else {
      console.log(`✅ Anonymous connection successful`);
      console.log(`   Able to read ${anonData?.length || 0} records`);
    }
    
    // Test service role connection
    console.log('\n--- Service Role Connection Test ---');
    const { data: serviceData, error: serviceError } = await supabaseService
      .from('unlearning_requests')
      .select('id')
      .limit(1);
      
    if (serviceError) {
      console.log(`❌ Service role connection failed: ${serviceError.message}`);
      console.log(`   Code: ${serviceError.code}`);
    } else {
      console.log(`✅ Service role connection successful`);
      console.log(`   Able to read ${serviceData?.length || 0} records`);
    }
    
    // Test insert with service role
    console.log('\n--- Insert Test with Service Role ---');
    const testRecord = {
      user_id: '00000000-0000-0000-0000-000000000000',
      model_id: null,
      request_reason: 'Test record for connection verification',
      data_count: 1,
      status: 'completed',
      processing_time_seconds: 10,
      blockchain_tx_hash: null,
      audit_trail: {
        leak_score: 0.01,
        zk_proof: 'test-proof-connection',
        ipfs_hash: 'QmTestConnection'
      },
      created_at: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabaseService
      .from('unlearning_requests')
      .insert([testRecord])
      .select();
      
    if (insertError) {
      console.log(`❌ Insert failed: ${insertError.message}`);
      console.log(`   Code: ${insertError.code}`);
    } else {
      console.log(`✅ Insert successful`);
      console.log(`   Record ID: ${insertData?.[0]?.id}`);
      
      // Clean up - delete the test record
      if (insertData?.[0]?.id) {
        const { error: deleteError } = await supabaseService
          .from('unlearning_requests')
          .delete()
          .eq('id', insertData[0].id);
          
        if (deleteError) {
          console.log(`⚠️  Failed to clean up test record: ${deleteError.message}`);
        } else {
          console.log(`✅ Test record cleaned up`);
        }
      }
    }
    
    console.log('\n🎉 Database connection test completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error during test:', error);
    process.exit(1);
  }
}

testConnections();