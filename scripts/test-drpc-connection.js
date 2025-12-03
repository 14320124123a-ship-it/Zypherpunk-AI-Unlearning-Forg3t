#!/usr/bin/env node

const { RpcProvider } = require('starknet');

console.log('Testing drpc.org Connection');
console.log('==========================');

const provider = new RpcProvider({
    nodeUrl: 'https://starknet-sepolia.drpc.org'
});

provider.getChainId().then(chainId => {
    console.log(`Connected to chain: ${chainId}`);
    
    // Test getting block number with a simpler method
    return provider.getBlock('latest');
}).then(block => {
    console.log(`Latest block number: ${block.block_number}`);
    console.log('Connection test successful!');
}).catch(error => {
    console.error('Connection failed:', error.message);
    
    // Let's try another approach - just get the chain ID
    console.log('\nTrying alternative connection test...');
    const simpleProvider = new RpcProvider({
        nodeUrl: 'https://starknet-sepolia.drpc.org'
    });
    
    simpleProvider.getChainId().then(chainId => {
        console.log(`Alternative test - Connected to chain: ${chainId}`);
        console.log('Basic connection works!');
    }).catch(altError => {
        console.error('Alternative test also failed:', altError.message);
    });
});