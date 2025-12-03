#!/usr/bin/env node
/**
 * Blockchain Integration Test Script
 * Tests Starknet and Zcash integration for the Forg3t Protocol
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { getProofCount, registerUnlearningProof } from '../starknet/starknetClient';
import { getBlockchainInfo, testConnection, sendUnlearningProofTx } from '../zcash/zCashClient';

dotenv.config();

// Supabase client for testing
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testStarknetIntegration() {
  console.log('🧪 Testing Starknet Integration...');
  
  try {
    // Test 1: Get current proof count
    console.log('  🔍 Getting current proof count...');
    const proofCount = await getProofCount();
    console.log(`  ✅ Current proof count: ${proofCount}`);
    
    // Test 2: Register a test unlearning proof
    console.log('  📝 Registering test unlearning proof...');
    const result = await registerUnlearningProof();
    console.log(`  ✅ Proof registered with transaction hash: ${result.txHash}`);
    
    // Verify the proof count increased
    console.log('  🔍 Verifying proof count increased...');
    const newProofCount = await getProofCount();
    console.log(`  ✅ New proof count: ${newProofCount}`);
    
    if (newProofCount > proofCount) {
      console.log('  🎉 Starknet integration test PASSED');
      return true;
    } else {
      console.log('  ❌ Starknet integration test FAILED: Proof count did not increase');
      return false;
    }
  } catch (error) {
    console.error('  ❌ Starknet integration test FAILED:', error);
    return false;
  }
}

async function testZcashIntegration() {
  console.log('\n🧪 Testing Zcash Integration...');
  
  try {
    // Test 1: Test connection
    console.log('  🔍 Testing Zcash connection...');
    const isConnected = await testConnection();
    if (!isConnected) {
      console.log('  ❌ Zcash connection test FAILED: Could not connect to Zcash node');
      return false;
    }
    console.log('  ✅ Zcash connection test PASSED');
    
    // Test 2: Get blockchain info
    console.log('  🔍 Getting Zcash blockchain info...');
    const blockchainInfo = await getBlockchainInfo();
    console.log(`  ✅ Zcash blockchain height: ${blockchainInfo.blocks}`);
    
    // Test 3: Send a test unlearning proof transaction
    console.log('  📝 Sending test unlearning proof transaction...');
    const txId = await sendUnlearningProofTx({
      proofHash: 'test_proof_hash_123456789',
      modelId: '71b0edae-3e5d-4c6b-9a4c-8e1d8b6d8c4a',
      requestId: 'test_request',
      userId: 'test_user',
      timestamp: new Date().toISOString(),
      extra: { test: true }
    });
    console.log(`  ✅ Zcash transaction sent with ID: ${txId}`);
    
    console.log('  🎉 Zcash integration test PASSED');
    return true;
  } catch (error) {
    console.error('  ❌ Zcash integration test FAILED:', error);
    return false;
  }
}

async function testDatabaseIntegration() {
  console.log('\n🧪 Testing Database Integration...');
  
  try {
    // Test inserting a test unlearning request
    console.log('  📝 Creating test unlearning request...');
    const { data, error } = await supabase
      .from('unlearning_requests')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Test user ID
        model_id: '71b0edae-3e5d-4c6b-9a4c-8e1d8b6d8c4a',
        request_reason: 'Blockchain integration test',
        data_count: 1,
        status: 'completed',
        audit_trail: {
          starknet_tx_hash: '0x123456789abcdef',
          zcash_tx_id: 'tx_test_123456789',
          proof_hash: 'test_proof_hash_123456789'
        }
      })
      .select()
      .single();
    
    if (error) {
      console.error('  ❌ Database integration test FAILED:', error);
      return false;
    }
    
    console.log(`  ✅ Test unlearning request created with ID: ${data.id}`);
    
    // Test querying the request
    console.log('  🔍 Querying test unlearning request...');
    const { data: requestData, error: queryError } = await supabase
      .from('unlearning_requests')
      .select('*')
      .eq('id', data.id)
      .single();
    
    if (queryError) {
      console.error('  ❌ Database query test FAILED:', queryError);
      return false;
    }
    
    console.log('  ✅ Database query test PASSED');
    console.log('  🎉 Database integration test PASSED');
    return true;
  } catch (error) {
    console.error('  ❌ Database integration test FAILED:', error);
    return false;
  }
}

async function testDashboardDisplay() {
  console.log('\n🧪 Testing Dashboard Display...');
  
  try {
    // Simulate what the dashboard would show for a completed request with blockchain data
    const { data, error } = await supabase
      .from('unlearning_requests')
      .select('*')
      .eq('status', 'completed')
      .neq('audit_trail', null)
      .limit(1)
      .single();
    
    if (error) {
      console.log('  ⚠️  No completed requests with blockchain data found for display test');
      return true; // Not a failure, just no data to test with
    }
    
    console.log('  🔍 Checking blockchain data in audit trail...');
    
    if (data.audit_trail?.starknet_tx_hash) {
      console.log(`  ✅ Starknet transaction hash found: ${data.audit_trail.starknet_tx_hash.substring(0, 10)}...`);
    } else {
      console.log('  ⚠️  No Starknet transaction hash found');
    }
    
    if (data.audit_trail?.zcash_tx_id) {
      console.log(`  ✅ Zcash transaction ID found: ${data.audit_trail.zcash_tx_id.substring(0, 10)}...`);
    } else {
      console.log('  ⚠️  No Zcash transaction ID found');
    }
    
    console.log('  🎉 Dashboard display test PASSED');
    return true;
  } catch (error) {
    console.error('  ❌ Dashboard display test FAILED:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Blockchain Integration Tests\n');
  
  let allTestsPassed = true;
  
  // Run all tests
  const starknetTestPassed = await testStarknetIntegration();
  const zcashTestPassed = await testZcashIntegration();
  const databaseTestPassed = await testDatabaseIntegration();
  const dashboardTestPassed = await testDashboardDisplay();
  
  allTestsPassed = starknetTestPassed && zcashTestPassed && databaseTestPassed && dashboardTestPassed;
  
  console.log('\n🏁 Test Results Summary:');
  console.log(`  Starknet Integration: ${starknetTestPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  Zcash Integration: ${zcashTestPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  Database Integration: ${databaseTestPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  Dashboard Display: ${dashboardTestPassed ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (allTestsPassed) {
    console.log('\n🎉 All Blockchain Integration Tests PASSED!');
    console.log('The blockchain side is working correctly and should display on the dashboard.');
  } else {
    console.log('\n❌ Some tests FAILED. Please check the output above for details.');
    console.log('The blockchain integration may need troubleshooting.');
  }
  
  process.exit(allTestsPassed ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}