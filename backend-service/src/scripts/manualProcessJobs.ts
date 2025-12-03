#!/usr/bin/env node
/**
 * Manual Job Processing Script
 * Manually triggers processing of completed jobs that may be missing blockchain data
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { recordUnlearningOnChains } from '../services/onchainUnlearningService';

dotenv.config();

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function manualProcessJobs() {
  console.log('🔄 Manual Job Processing Tool\n');
  
  try {
    // Find completed jobs that don't have blockchain data
    const { data: jobs, error } = await supabase
      .from('unlearning_requests')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching jobs:', error.message);
      return false;
    }
    
    if (!jobs || jobs.length === 0) {
      console.log('⚠️  No completed jobs found.');
      return true;
    }
    
    console.log(`✅ Found ${jobs.length} completed jobs.`);
    
    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const job of jobs) {
      console.log(`\n📋 Processing Job ID: ${job.id.substring(0, 8)}...`);
      
      // Check if job already has blockchain data
      if (job.audit_trail && 
          (job.audit_trail.starknet_tx_hash || 
           job.audit_trail.l2_tx_id || 
           job.audit_trail.zcash_tx_id || 
           job.audit_trail.l1_tze_tx_id)) {
        console.log('   ℹ️  Already has blockchain data, skipping...');
        skippedCount++;
        continue;
      }
      
      try {
        console.log('   🔄 Processing blockchain anchoring...');
        
        // Create context for onchain processing
        const context = {
          jobId: job.id,
          modelId: job.model_id,
          requestId: job.id, // Using job ID as request ID
          userId: job.user_id,
          timestamp: new Date(job.created_at)
        };
        
        // Process the job
        const result = await recordUnlearningOnChains(context);
        
        if (result.error) {
          console.log(`   ⚠️  Errors during processing: ${result.error}`);
          errorCount++;
        } else {
          console.log('   ✅ Blockchain anchoring completed successfully');
          
          // Update the job with blockchain data
          const { error: updateError } = await supabase
            .from('unlearning_requests')
            .update({
              blockchain_tx_hash: result.zcashTxId || null,
              audit_trail: {
                ...(job.audit_trail || {}),
                starknet_tx_hash: result.starknetTxHash || null,
                zcash_tx_id: result.zcashTxId || null,
                onchain_error: result.error || null
              }
            })
            .eq('id', job.id);
          
          if (updateError) {
            console.log(`   ❌ Error updating job: ${updateError.message}`);
            errorCount++;
          } else {
            console.log('   💾 Job updated with blockchain data');
            processedCount++;
          }
        }
      } catch (err) {
        console.log(`   ❌ Error processing job: ${err instanceof Error ? err.message : 'Unknown error'}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 Processing Summary:');
    console.log(`   Successfully processed: ${processedCount}`);
    console.log(`   Skipped (already processed): ${skippedCount}`);
    console.log(`   Errors: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some jobs failed to process. Check the errors above.');
      return false;
    }
    
    console.log('\n🎉 Manual job processing completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Error during manual job processing:', error);
    return false;
  }
}

async function main() {
  console.log('🛠️  Manual Job Processing Utility');
  console.log('================================\n');
  
  // Confirm with user before proceeding
  console.log('⚠️  This will attempt to manually process completed jobs that may be missing blockchain data.');
  console.log('⚠️  This should only be used for testing purposes.');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('Do you want to proceed? (y/N): ', async (answer: string) => {
    readline.close();
    
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled.');
      process.exit(0);
    }
    
    const success = await manualProcessJobs();
    
    if (success) {
      console.log('\n✅ Manual job processing completed.');
    } else {
      console.log('\n❌ Manual job processing encountered issues.');
    }
    
    process.exit(success ? 0 : 1);
  });
}

if (require.main === module) {
  main().catch(console.error);
}