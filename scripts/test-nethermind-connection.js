#!/usr/bin/env node

const { RpcProvider } = require('starknet');

console.log('Testing Nethermind Connection');
console.log('============================');

const provider = new RpcProvider({
    nodeUrl: 'https://free-rpc.nethermind.io/sepolia-juno/v0_7'
});

provider.getChainId().then(chainId => {
    console.log(`Connected to chain: ${chainId}`);
    console.log('Connection test successful!');
}).catch(error => {
    console.error('Connection failed:', error.message);
});