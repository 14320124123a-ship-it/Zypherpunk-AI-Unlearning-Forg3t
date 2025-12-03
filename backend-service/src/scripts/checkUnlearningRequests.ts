import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Use service role key to bypass RLS
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

async function checkUnlearningRequests() {
  console.log('🔍 Checking Unlearning Requests Status');
  console.log('====================================');
  
  try {
    // Get all unlearning requests
    const { data: requests, error } = await supabase
      .from('unlearning_requests')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('❌ Failed to fetch requests:', error.message);
      process.exit(1);
    }
    
    console.log(`📋 Found ${requests?.length || 0} total unlearning requests`);
    
    if (requests && requests.length > 0) {
      console.log('\n📝 All Requests:');
      requests.forEach((request: any, index: number) => {
        console.log(`\n${index + 1}. ID: ${request.id}`);
        console.log(`   User ID: ${request.user_id?.slice(0, 8) || 'N/A'}...`);
        console.log(`   Status: ${request.status}`);
        console.log(`   Reason: ${request.request_reason}`);
        console.log(`   Created: ${new Date(request.created_at).toLocaleString()}`);
        console.log(`   Data Count: ${request.data_count}`);
        console.log(`   Processing Time: ${request.processing_time_seconds || 'N/A'}s`);
        
        if (request.audit_trail) {
          const auditTrail = request.audit_trail;
          console.log(`   Audit Trail:`);
          console.log(`     Leak Score: ${auditTrail.leak_score !== undefined ? auditTrail.leak_score : 'N/A'}`);
          console.log(`     zk-SNARK: ${auditTrail.zk_proof ? `${auditTrail.zk_proof.slice(0, 16)}...` : 'N/A'}`);
          console.log(`     IPFS Hash: ${auditTrail.ipfs_hash ? `${auditTrail.ipfs_hash.slice(0, 16)}...` : 'N/A'}`);
          
          if (auditTrail.starknet_tx_hash) {
            console.log(`     Starknet TX: ${auditTrail.starknet_tx_hash.slice(0, 16)}...`);
          }
          if (auditTrail.zcash_tx_id) {
            console.log(`     Zcash TX: ${auditTrail.zcash_tx_id.slice(0, 16)}...`);
          }
          if (auditTrail.onchain_error) {
            console.log(`     On-chain Error: ${auditTrail.onchain_error}`);
          }
        } else {
          console.log(`   Audit Trail: None`);
        }
      });
      
      // Check specifically for completed requests that haven't been processed
      const completedUnprocessed = requests.filter((request: any) => 
        request.status === 'completed' && 
        (!request.audit_trail || 
         (!request.audit_trail.starknet_tx_hash && 
          !request.audit_trail.zcash_tx_id && 
          !request.audit_trail.l2_tx_id && 
          !request.audit_trail.l1_tze_tx_id))
      );
      
      console.log(`\n🔍 Found ${completedUnprocessed.length} completed but unprocessed requests`);
      
      if (completedUnprocessed.length > 0) {
        console.log('\n🔄 These requests should be processed by the backend service:');
        completedUnprocessed.forEach((request: any, index: number) => {
          console.log(`   ${index + 1}. ID: ${request.id} - ${request.request_reason}`);
        });
      }
    } else {
      console.log('\n📭 No unlearning requests found in the database');
    }
    
  } catch (error) {
    console.error('❌ Error checking requests:', error);
    process.exit(1);
  }
}

checkUnlearningRequests();