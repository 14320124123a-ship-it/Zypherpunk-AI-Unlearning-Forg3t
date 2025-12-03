import { getProofCount } from '../starknet/starknetClient';
import { getBlockchainInfo } from '../zcash/zCashClient';

async function simpleStarknetTest() {
  console.log('🔍 Simple Starknet and Zcash Integration Test');
  console.log('===========================================');
  
  try {
    // Test Starknet connection
    console.log('\n1. Testing Starknet Connection...');
    const proofCount = await getProofCount();
    console.log(`✅ Starknet connection successful`);
    console.log(`📊 Current proof count in registry: ${proofCount.toString()}`);
    
    // Test Zcash connection
    console.log('\n2. Testing Zcash Connection...');
    const blockchainInfo = await getBlockchainInfo();
    console.log(`✅ Zcash connection successful`);
    console.log(`🔗 Chain: ${blockchainInfo.chain}`);
    console.log(`📈 Block height: ${blockchainInfo.blocks}`);
    console.log(`🕒 Best block time: ${blockchainInfo.bestblocktime}`);
    
    console.log('\n🎉 Simple integration test completed successfully!');
    console.log('\nThis confirms that:');
    console.log('   - Starknet RPC endpoint is accessible');
    console.log('   - Zcash node is running and accessible');
    console.log('   - Both blockchain integrations are working');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    process.exit(1);
  }
}

simpleStarknetTest();