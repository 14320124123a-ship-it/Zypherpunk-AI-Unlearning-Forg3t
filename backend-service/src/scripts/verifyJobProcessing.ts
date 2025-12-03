#!/usr/bin/env node
/**
 * Job Processing Verification Script
 * Checks if the backend service is properly processing completed jobs
 * and adding blockchain data to the audit trail
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyJobProcessing() {
  console.log('🔍 Verifying Job Processing...\n');
  
  try {
    // Check for completed jobs that should have blockchain data
    const { data: completedJobs, error } = await supabase
      .from('unlearning_requests')
      .select('*')
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching completed jobs:', error.message);
      return false;
    }
    
    if (!completedJobs || completedJobs.length === 0) {
      console.log('⚠️  No completed jobs found.');
      console.log('   Perform an unlearning request first to test job processing.');
      return true;
    }
    
    console.log(`✅ Found ${completedJobs.length} completed jobs.`);
    
    let processedJobs = 0;
    let unprocessedJobs = 0;
    
    for (const job of completedJobs) {
      console.log(`\n📋 Job ID: ${job.id.substring(0, 8)}...`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Created: ${new Date(job.created_at).toLocaleString()}`);
      console.log(`   Updated: ${new Date(job.updated_at).toLocaleString()}`);
      
      if (job.audit_trail) {
        const auditTrail = job.audit_trail;
        const hasBlockchainData = 
          auditTrail.starknet_tx_hash || 
          auditTrail.l2_tx_id || 
          auditTrail.zcash_tx_id || 
          auditTrail.l1_tze_tx_id;
        
        if (hasBlockchainData) {
          console.log('   ✅ Blockchain data present:');
          if (auditTrail.starknet_tx_hash) {
            console.log(`      Starknet: ${auditTrail.starknet_tx_hash.substring(0, 20)}...`);
          }
          if (auditTrail.l2_tx_id) {
            console.log(`      Starknet L2: ${auditTrail.l2_tx_id.substring(0, 20)}...`);
          }
          if (auditTrail.zcash_tx_id) {
            console.log(`      Zcash: ${auditTrail.zcash_tx_id.substring(0, 20)}...`);
          }
          if (auditTrail.l1_tze_tx_id) {
            console.log(`      Zcash L1: ${auditTrail.l1_tze_tx_id.substring(0, 20)}...`);
          }
          processedJobs++;
        } else {
          console.log('   ⚠️  No blockchain data found (still processing?)');
          unprocessedJobs++;
        }
      } else {
        console.log('   ⚠️  No audit trail found (still processing?)');
        unprocessedJobs++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   Jobs with blockchain data: ${processedJobs}`);
    console.log(`   Jobs without blockchain data: ${unprocessedJobs}`);
    
    if (unprocessedJobs > 0) {
      console.log('\n💡 Tip: If jobs are stuck without blockchain data:');
      console.log('   1. Check if the backend service is running');
      console.log('   2. Check backend service logs for errors');
      console.log('   3. Verify Starknet and Zcash configurations');
      return false;
    }
    
    console.log('\n🎉 Job processing is working correctly!');
    return true;
    
  } catch (error) {
    console.error('❌ Error verifying job processing:', error);
    return false;
  }
}

async function main() {
  console.log('🔧 Job Processing Verification Tool');
  console.log('==================================\n');
  
  const success = await verifyJobProcessing();
  
  if (success) {
    console.log('\n✅ Job processing verification completed successfully.');
  } else {
    console.log('\n❌ Job processing verification encountered issues.');
    console.log('   Check the output above for details.');
  }
  
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}