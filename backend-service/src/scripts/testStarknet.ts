import { getProofCount } from '../starknet/starknetClient';

async function testStarknet() {
  try {
    console.log('Testing Starknet integration...');
    const count = await getProofCount();
    console.log(`Current proof count: ${count}`);
  } catch (error) {
    console.error('Error testing Starknet integration:', error);
  }
}

testStarknet();