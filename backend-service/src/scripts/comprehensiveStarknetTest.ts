import { getProofCount, registerUnlearningProof } from '../starknet/starknetClient';

async function testStarknet() {
  try {
    console.log('Testing Starknet integration...');
    
    // Test 1: Get current proof count
    console.log('Getting current proof count...');
    const count = await getProofCount();
    console.log(`Current proof count: ${count}`);
    
    // Test 2: Register a new unlearning proof
    console.log('Registering test unlearning proof...');
    const result = await registerUnlearningProof();
    console.log(`Unlearning proof registered with transaction hash: ${result.txHash}`);
    
    // Test 3: Verify the proof count increased
    console.log('Verifying proof count increased...');
    const newCount = await getProofCount();
    console.log(`New proof count: ${newCount}`);
    
    if (newCount > count) {
      console.log('✅ Starknet integration test PASSED!');
    } else {
      console.log('❌ Starknet integration test FAILED: Proof count did not increase');
    }
  } catch (error) {
    console.error('❌ Error testing Starknet integration:', error);
  }
}

testStarknet();