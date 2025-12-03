// Simple test script to demonstrate the Ztarknet integration flow
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration (using the same as in the project)
const supabaseUrl = 'https://diauozuvbzggdnpwagjr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpYXVvenV2YnpnZ2RucHdhZ2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMTE2MjYsImV4cCI6MjA2Njc4NzYyNn0.CyUBtu7Gue8mpnaPJ-Q8VwoXR-H1FVz7Zv36mqjGJzE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTestFlow() {
  console.log('🚀 Starting test flow for Ztarknet integration...');
  
  // Create a dummy unlearning request
  const dummyRequest = {
    user_id: 'test-user-id', // In a real scenario, this would be an actual user ID
    model_id: 'test-model-123',
    request_reason: 'Test unlearning request for Ztarknet integration',
    data_count: 10,
    status: 'completed',
    processing_time_seconds: 120,
    blockchain_tx_hash: null, // This will be filled by our backend service
    audit_trail: {
      leak_score: 0.05,
      zk_proof: 'test-proof-hash-123',
      ipfs_hash: 'QmTestHash1234567890abcdefghijklmnopqrstuvwxyz'
    },
    created_at: new Date().toISOString()
  };
  
  console.log('📝 Creating dummy unlearning request...');
  
  // Insert the dummy request into the database
  const { data, error } = await supabase
    .from('unlearning_requests')
    .insert([dummyRequest])
    .select();
  
  if (error) {
    console.error('❌ Failed to create dummy request:', error);
    return;
  }
  
  const requestId = data[0].id;
  console.log(`✅ Dummy request created with ID: ${requestId}`);
  
  console.log('⏳ Waiting for backend service to process the request...');
  console.log('💡 In a real scenario, the backend service would:');
  console.log('   1. Detect this completed request');
  console.log('   2. Generate a proof hash');
  console.log('   3. Submit it to the L2 contract');
  console.log('   4. Wait for L1 anchoring');
  console.log('   5. Update the request with transaction IDs');
  
  // Simulate waiting for the backend service
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('🔍 Checking if the request was updated with Ztarknet info...');
  
  // Check if the request was updated
  const { data: updatedData, error: fetchError } = await supabase
    .from('unlearning_requests')
    .select('*')
    .eq('id', requestId)
    .single();
  
  if (fetchError) {
    console.error('❌ Failed to fetch updated request:', fetchError);
    return;
  }
  
  if (updatedData.blockchain_tx_hash && updatedData.audit_trail.l1_tze_tx_id) {
    console.log('✅ Request successfully updated with Ztarknet information!');
    console.log(`🔗 L1 TZE Transaction: ${updatedData.blockchain_tx_hash}`);
    console.log(`🔗 L2 Transaction: ${updatedData.audit_trail.l2_tx_id}`);
    console.log(`🔗 Proof Hash: ${updatedData.audit_trail.proof_hash}`);
  } else {
    console.log('⚠️ Request not yet updated. In a real scenario, this would happen shortly.');
    console.log('💡 The backend service is likely still processing the request.');
  }
  
  console.log('\n🎉 Test flow completed!');
  console.log('📊 To see the full integration in action:');
  console.log('   1. Start the Docker devnet: docker-compose up -d');
  console.log('   2. Start the backend services: ./scripts/start-backend.sh');
  console.log('   3. Run the React app: cd project && npm run dev');
  console.log('   4. Create a real unlearning request in the app');
  console.log('   5. Mark it as completed');
  console.log('   6. Watch the dashboard for Ztarknet transaction info');
}

// Run the test flow
runTestFlow().catch(console.error);