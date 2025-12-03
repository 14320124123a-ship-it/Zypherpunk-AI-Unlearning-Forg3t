#!/usr/bin/env node

const { RpcProvider } = require('starknet');

console.log('StarkNet RPC Status Check');
console.log('====================');

// List of RPC endpoints to test
const rpcEndpoints = [
    'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/21xJKr6s7H7ynN5UxElPx',
    'https://starknet-sepolia.drpc.org',
    'https://free-rpc.nethermind.io/sepolia-juno/',
    'https://starknet-sepolia.public.blastapi.io'
];

async function checkRpcStatus() {
    console.log('\nTesting RPC endpoints...\n');
    
    for (const rpcUrl of rpcEndpoints) {
        try {
            console.log(`Testing: ${rpcUrl}`);
            const provider = new RpcProvider({ nodeUrl: rpcUrl });
            
            // Test basic connectivity
            const chainId = await provider.getChainId();
            console.log(`  ✅ Connected (Chain ID: ${chainId})`);
            
            // Test block fetching
            const block = await provider.getBlock('latest');
            console.log(`  ✅ Block access (Latest: ${block.block_number})`);
            
            // Test account balance check (using a known account)
            const ethTokenAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
            const result = await provider.callContract({
                contractAddress: ethTokenAddress,
                entrypoint: 'balanceOf',
                calldata: ['0x3d1675a0c13a180b1b4c2895d9bd0270d00a19556272360494b129fc2076c05']
            });
            
            const balance = BigInt(result[0]);
            const balanceEth = Number(balance) / 1e18;
            console.log(`  ✅ Contract calls working (Balance: ${balanceEth.toFixed(6)} ETH)`);
            
            console.log(`  🟢 ${rpcUrl} - ALL TESTS PASSED\n`);
        } catch (error) {
            console.log(`  ❌ Failed: ${error.message.substring(0, 50)}...\n`);
        }
    }
    
    console.log('RPC Status Check Complete');
    console.log('========================');
    console.log('If all endpoints failed, wait 24-48 hours and try again.');
    console.log('If some endpoints work, update your .env.testnet file with the working RPC URL.');
}

checkRpcStatus();