// Demo script to show the complete Ztarknet integration flow
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://diauozuvbzggdnpwagjr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpYXVvenV2YnpnZ2RucHdhZ2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMTE2MjYsImV4cCI6MjA2Njc4NzYyNn0.CyUBtu7Gue8mpnaPJ-Q8VwoXR-H1FVz7Zv36mqjGJzE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runDemoFlow() {
  console.log('🚀 Ztarknet Integration Demo Flow');
  console.log('=====================================');
  
  // Step 1: Create a dummy unlearning request
  console.log('\n1. Creating dummy unlearning request...');
  
  const dummyRequest = {
    user_id: 'demo-user-123',
    model_id: 'gpt-4-demo',
    request_reason: 'Demo request for Ztarknet integration',
    data_count: 25,
    status: 'completed',
    processing_time_seconds: 180,
    blockchain_tx_hash: null,
    audit_trail: {
      leak_score: 0.05,
      zk_proof: 'demo-zk-proof-12345',
      ipfs_hash: 'QmDemoHash1234567890abcdefghijklmnopqrstuvwxyz'
    },
    created_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('unlearning_requests')
    .insert([dummyRequest])
    .select();
  
  if (error) {
    console.error('❌ Failed to create dummy request:', error.message);
    return;
  }
  
  const requestId = data[0].id;
  console.log(`✅ Dummy request created with ID: ${requestId}`);
  
  // Step 2: Simulate backend processing
  console.log('\n2. Simulating backend Ztarknet processing...');
  console.log('   - Generating proof hash');
  console.log('   - Submitting to L2 contract');
  console.log('   - Waiting for L1 anchoring');
  
  // Wait a bit to simulate processing
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Step 3: Update the request with Ztarknet information
  console.log('\n3. Updating request with Ztarknet information...');
  
  const ztarknetInfo = {
    blockchain_tx_hash: '0xL1TzeTxHash1234567890abcdef1234567890abcdef', // L1 TZE transaction ID
    audit_trail: {
      ...dummyRequest.audit_trail,
      l2_tx_id: '0xL2TxHash1234567890abcdef1234567890abcdef',
      l1_tze_tx_id: '0xL1TzeTxHash1234567890abcdef1234567890abcdef',
      proof_hash: '0xProofHash1234567890abcdef1234567890abcdef'
    }
  };
  
  const { error: updateError } = await supabase
    .from('unlearning_requests')
    .update(ztarknetInfo)
    .eq('id', requestId);
  
  if (updateError) {
    console.error('❌ Failed to update request with Ztarknet info:', updateError.message);
    return;
  }
  
  console.log('✅ Request updated with Ztarknet information');
  
  // Step 4: Verify the update
  console.log('\n4. Verifying Ztarknet information...');
  
  const { data: updatedData, error: fetchError } = await supabase
    .from('unlearning_requests')
    .select('*')
    .eq('id', requestId)
    .single();
  
  if (fetchError) {
    console.error('❌ Failed to fetch updated request:', fetchError.message);
    return;
  }
  
  console.log('\n📋 Ztarknet Information:');
  console.log(`   L2 Transaction ID: ${updatedData.audit_trail.l2_tx_id}`);
  console.log(`   L1 TZE Transaction ID: ${updatedData.audit_trail.l1_tze_tx_id}`);
  console.log(`   Proof Hash: ${updatedData.audit_trail.proof_hash}`);
  
  // Step 5: Show how to access the local explorer
  console.log('\n5. Accessing information via local explorer...');
  console.log(`   Explorer URL: http://localhost:3001/api/transaction/${updatedData.audit_trail.l1_tze_tx_id}`);
  console.log(`   All transactions: http://localhost:3001/api/transactions`);
  
  console.log('\n🎉 Demo flow completed successfully!');
  console.log('\nTo see this in action with the real application:');
  console.log('   1. Start the Docker devnet: docker-compose up -d');
  console.log('   2. Start the backend services: ./scripts/start-backend.sh');
  console.log('   3. Run the React app: cd project && npm run dev');
  console.log('   4. Create a real unlearning request in the app');
  console.log('   5. Mark it as completed');
  console.log('   6. Watch the dashboard for Ztarknet transaction info');
}

// Run the demo flow
runDemoFlow().catch(console.error);