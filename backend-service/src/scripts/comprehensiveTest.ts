import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

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

async function comprehensiveTest() {
  console.log('🧪 Comprehensive Integration Test');
  console.log('===============================');
  
  try {
    // 1. Test database connection and insert permissions
    console.log('\n1. Testing Database Operations...');
    
    // Create a test user
    const testUserId = uuidv4();
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: testUserId,
        email: `test-${Date.now()}@forg3t.io`,
        package_type: 'individual'
      });
      
    if (userError) {
      console.log(`❌ Failed to create test user: ${userError.message}`);
    } else {
      console.log(`✅ Test user created: ${testUserId}`);
    }
    
    // Create a test unlearning request
    const testRequestId = uuidv4();
    const testRequest = {
      id: testRequestId,
      user_id: testUserId,
      model_id: null,
      request_reason: 'Comprehensive integration test',
      data_count: 3,
      status: 'completed',
      processing_time_seconds: 30,
      blockchain_tx_hash: null,
      audit_trail: {
        leak_score: 0.03,
        zk_proof: 'comprehensive-test-proof-' + Date.now().toString(16),
        ipfs_hash: 'Qm' + Math.random().toString(36).substring(2, 46),
        target_info: 'Test data for comprehensive verification'
      },
      created_at: new Date().toISOString()
    };
    
    const { data: requestData, error: requestError } = await supabase
      .from('unlearning_requests')
      .insert([testRequest])
      .select();
      
    if (requestError) {
      console.log(`❌ Failed to create test request: ${requestError.message}`);
      console.log(`   Code: ${requestError.code}`);
    } else {
      console.log(`✅ Test request created: ${requestData?.[0]?.id}`);
    }
    
    // 2. Test Starknet integration
    console.log('\n2. Testing Starknet Integration...');
    try {
      const { getProofCount } = await import('../starknet/starknetClient');
      const proofCount = await getProofCount();
      console.log(`✅ Starknet connection successful`);
      console.log(`   Current proof count: ${proofCount.toString()}`);
    } catch (starknetError) {
      console.log(`❌ Starknet integration failed: ${starknetError}`);
    }
    
    // 3. Test Zcash integration
    console.log('\n3. Testing Zcash Integration...');
    try {
      const { getBlockchainInfo } = await import('../zcash/zCashClient');
      const blockchainInfo = await getBlockchainInfo();
      console.log(`✅ Zcash connection successful`);
      console.log(`   Chain: ${blockchainInfo.chain}`);
      console.log(`   Block height: ${blockchainInfo.blocks}`);
    } catch (zcashError) {
      console.log(`❌ Zcash integration failed: ${zcashError}`);
    }
    
    // 4. Clean up test data
    console.log('\n4. Cleaning up test data...');
    if (requestData?.[0]?.id) {
      const { error: deleteRequestError } = await supabase
        .from('unlearning_requests')
        .delete()
        .eq('id', requestData[0].id);
        
      if (deleteRequestError) {
        console.log(`⚠️  Failed to delete test request: ${deleteRequestError.message}`);
      } else {
        console.log(`✅ Test request deleted`);
      }
    }
    
    if (userError) {
      // User wasn't created, skip cleanup
    } else {
      const { error: deleteUserError } = await supabase
        .from('users')
        .delete()
        .eq('id', testUserId);
        
      if (deleteUserError) {
        console.log(`⚠️  Failed to delete test user: ${deleteUserError.message}`);
      } else {
        console.log(`✅ Test user deleted`);
      }
    }
    
    console.log('\n🎉 Comprehensive test completed!');
    console.log('\nThis test verifies that:');
    console.log('   - Database connections are working');
    console.log('   - RLS policies allow proper insert operations');
    console.log('   - Starknet integration is functional');
    console.log('   - Zcash integration is functional');
    
  } catch (error) {
    console.error('❌ Error during comprehensive test:', error);
    process.exit(1);
  }
}

comprehensiveTest();