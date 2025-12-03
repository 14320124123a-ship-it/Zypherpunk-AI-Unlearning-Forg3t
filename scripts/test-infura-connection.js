#!/usr/bin/env node

const { RpcProvider } = require('starknet');

console.log('Testing Infura Connection');
console.log('========================');

// Using a public Infura endpoint for testing
const provider = new RpcProvider({
    nodeUrl: 'https://starknet-sepolia.infura.io/v3/6b7d4d0a0f0a4c0a9c0a0f0a0f0a0f0a'
});

provider.getChainId().then(chainId => {
    console.log(`Connected to chain: ${chainId}`);
}).catch(error => {
    console.error('Connection failed:', error.message);
});