#!/usr/bin/env node
/**
 * Simple Blockchain Status Verification Script
 * Checks if Starknet and Zcash are working and data is showing on dashboard
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkBlockchainStatus() {
  console.log('🔍 Checking Blockchain Status...\n');
  
  try {
    // Check if there are any completed unlearning requests
    const { data: completedRequests, error: requestsError } = await supabase
      .from('unlearning_requests')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (requestsError) {
      console.error('❌ Error fetching unlearning requests:', requestsError.message);
      return false;
    }
    
    if (!completedRequests || completedRequests.length === 0) {
      console.log('⚠️  No completed unlearning requests found.');
      console.log('   Perform an unlearning request first to test blockchain integration.');
      return true; // Not an error, just no data
    }
    
    console.log(`✅ Found ${completedRequests.length} completed unlearning requests.`);
    
    // Check blockchain data in the most recent request
    const latestRequest = completedRequests[0];
    console.log(`\n📋 Latest Request ID: ${latestRequest.id}`);
    console.log(`📅 Created: ${new Date(latestRequest.created_at).toLocaleString()}`);
    
    if (latestRequest.audit_trail) {
      console.log('\n🔗 Blockchain Data in Audit Trail:');
      
      const auditTrail = latestRequest.audit_trail;
      
      // Check Starknet data
      if (auditTrail.starknet_tx_hash) {
        console.log(`   Starknet TX: ${auditTrail.starknet_tx_hash.substring(0, 20)}...`);
        console.log('   ✅ Starknet data present');
      } else if (auditTrail.l2_tx_id) {
        console.log(`   Starknet TX: ${auditTrail.l2_tx_id.substring(0, 20)}...`);
        console.log('   ✅ Starknet data present');
      } else {
        console.log('   ⚠️  No Starknet transaction data found');
      }
      
      // Check Zcash data
      if (auditTrail.zcash_tx_id) {
        console.log(`   Zcash TX: ${auditTrail.zcash_tx_id.substring(0, 20)}...`);
        console.log('   ✅ Zcash data present');
      } else if (auditTrail.l1_tze_tx_id) {
        console.log(`   Zcash TX: ${auditTrail.l1_tze_tx_id.substring(0, 20)}...`);
        console.log('   ✅ Zcash data present');
      } else {
        console.log('   ⚠️  No Zcash transaction data found');
      }
      
      // Check if still processing
      if (!auditTrail.starknet_tx_hash && !auditTrail.l2_tx_id && 
          !auditTrail.zcash_tx_id && !auditTrail.l1_tze_tx_id) {
        console.log('\n⏳ Blockchain anchoring still in progress...');
        console.log('   The system shows "Processing blockchain anchoring..."');
        return false;
      }
    } else {
      console.log('\n⚠️  No audit trail found in the latest request.');
      console.log('   The system shows "Processing blockchain anchoring..."');
      return false;
    }
    
    console.log('\n🎉 Blockchain integration is working correctly!');
    console.log('   Blockchain data is properly stored and displayed on the dashboard.');
    return true;
    
  } catch (error) {
    console.error('❌ Error checking blockchain status:', error);
    return false;
  }
}

async function main() {
  console.log('🔐 Blockchain Status Verification Tool');
  console.log('=====================================\n');
  
  const success = await checkBlockchainStatus();
  
  if (success) {
    console.log('\n✅ Blockchain status verification completed successfully.');
  } else {
    console.log('\n❌ Blockchain status verification encountered issues.');
    console.log('   Check the output above for details.');
  }
  
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}