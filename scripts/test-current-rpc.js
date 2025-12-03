#!/usr/bin/env node

const { RpcProvider } = require('starknet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('Testing Current RPC Configuration');
console.log('================================');

// Load environment variables from .env.testnet file
const envTestnetPath = path.join(__dirname, '..', '.env.testnet');
if (fs.existsSync(envTestnetPath)) {
    console.log('Loading environment variables from .env.testnet...');
    const envConfig = dotenv.parse(fs.readFileSync(envTestnetPath));
    
    const rpcUrl = envConfig.L2_RPC_ENDPOINT;
    console.log(`RPC URL: ${rpcUrl}`);
    
    if (!rpcUrl || rpcUrl.includes('YOUR_')) {
        console.log('⚠️  No valid RPC endpoint found in .env.testnet');
        process.exit(1);
    }
    
    // Initialize provider
    const provider = new RpcProvider({
        nodeUrl: rpcUrl
    });
    
    // Test connection
    provider.getChainId().then(chainId => {
        console.log(`✅ Connected to chain: ${chainId}`);
        
        // Get latest block
        return provider.getBlock('latest');
    }).then(block => {
        console.log(`✅ Latest block number: ${block.block_number}`);
        console.log('✅ RPC connection test successful!');
    }).catch(error => {
        console.error('❌ RPC connection failed:', error.message);
    });
} else {
    console.log('⚠️  .env.testnet file not found');
}