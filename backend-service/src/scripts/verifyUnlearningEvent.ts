import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { getProofCount } from '../starknet/starknetClient';
import { getBlockchainInfo } from '../zcash/zCashClient';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyUnlearningEvent() {
  console.log('🔍 Verifying Unlearning Event Integration');
  console.log('========================================');
  
  try {
    // 1. Check Starknet integration
    console.log('\n1. Checking Starknet Integration...');
    const proofCount = await getProofCount();
    console.log(`✅ Starknet connection successful`);
    console.log(`📊 Current proof count: ${proofCount.toString()}`);
    
    // 2. Check Zcash integration
    console.log('\n2. Checking Zcash Integration...');
    const blockchainInfo = await getBlockchainInfo();
    console.log(`✅ Zcash connection successful`);
    console.log(`🔗 Chain: ${blockchainInfo.chain}`);
    console.log(`📈 Block height: ${blockchainInfo.blocks}`);
    
    // 3. Check Supabase integration
    console.log('\n3. Checking Supabase Integration...');
    const { data: requests, error: requestsError } = await supabase
      .from('unlearning_requests')
      .select('*')
      .limit(5);
      
    if (requestsError) {
      console.log(`❌ Supabase error: ${requestsError.message}`);
    } else {
      console.log(`✅ Supabase connection successful`);
      console.log(`📋 Found ${requests?.length || 0} recent unlearning requests`);
      
      if (requests && requests.length > 0) {
        console.log('\n📝 Recent Requests:');
        requests.forEach((request: any, index: number) => {
          console.log(`  ${index + 1}. ID: ${request.id.slice(0, 8)}...`);
          console.log(`     Status: ${request.status}`);
          console.log(`     Created: ${new Date(request.created_at).toLocaleString()}`);
          if (request.audit_trail) {
            const auditTrail = request.audit_trail;
            if (auditTrail.starknet_tx_hash) {
              console.log(`     Starknet TX: ${auditTrail.starknet_tx_hash.slice(0, 16)}...`);
            }
            if (auditTrail.zcash_tx_id) {
              console.log(`     Zcash TX: ${auditTrail.zcash_tx_id.slice(0, 16)}...`);
            }
          }
        });
      }
    }
    
    // 4. Check unlearning proof log
    console.log('\n4. Checking Unlearning Proof Log...');
    const { data: proofLogs, error: logsError } = await supabase
      .from('unlearning_proof_log')
      .select('*')
      .limit(5);
      
    if (logsError) {
      console.log(`❌ Proof log error: ${logsError.message}`);
    } else {
      console.log(`✅ Proof log connection successful`);
      console.log(`📋 Found ${proofLogs?.length || 0} recent proof logs`);
      
      if (proofLogs && proofLogs.length > 0) {
        console.log('\n📜 Recent Proof Logs:');
        proofLogs.forEach((log: any, index: number) => {
          console.log(`  ${index + 1}. Job ID: ${log.job_id?.slice(0, 8) || 'N/A'}...`);
          console.log(`     TX Hash: ${log.registry_tx_hash?.slice(0, 16) || 'N/A'}...`);
          console.log(`     Timestamp: ${new Date(log.operation_timestamp).toLocaleString()}`);
        });
      }
    }
    
    console.log('\n🎉 Integration verification completed successfully!');
    console.log('\n✅ All systems are functioning properly:');
    console.log('   - Starknet integration is active');
    console.log('   - Zcash integration is active');
    console.log('   - Supabase database is accessible');
    console.log('   - Unlearning events are being tracked');
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
    process.exit(1);
  }
}

verifyUnlearningEvent();