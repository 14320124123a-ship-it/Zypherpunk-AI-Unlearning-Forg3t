#!/usr/bin/env node

const { RpcProvider, Account, Contract } = require('starknet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('Quick StarkNet Sepolia Integration Test');
console.log('=====================================');

// Load environment variables
const envTestnetPath = path.join(__dirname, '..', '.env.testnet');
if (fs.existsSync(envTestnetPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envTestnetPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

// Check required environment variables
const requiredEnvVars = ['STARKNET_ACCOUNT_ADDRESS', 'STARKNET_PRIVATE_KEY', 'ALCHEMY_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.log('❌ Missing required environment variables:');
    missingEnvVars.forEach(envVar => console.log(`   - ${envVar}`));
    process.exit(1);
}

// Configuration
const config = {
    rpcUrl: `https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/${process.env.ALCHEMY_API_KEY}`,
    accountAddress: process.env.STARKNET_ACCOUNT_ADDRESS,
    privateKey: process.env.STARKNET_PRIVATE_KEY,
    contractAddress: '0x02f797a15292f9859f7d5fb76847b41bbd2778c35570f68af8e25a669c16bf3d'
};

async function quickTest() {
    try {
        console.log('\nInitializing connection...');
        const provider = new RpcProvider({ nodeUrl: config.rpcUrl });
        const account = new Account(provider, config.accountAddress, config.privateKey);
        
        // Check connection
        const chainId = await provider.getChainId();
        console.log(`✅ Connected to StarkNet (Chain ID: ${chainId})`);
        
        // Check account balance
        const balance = await provider.getBalance(config.accountAddress);
        console.log(`💰 Account balance: ${balance.toString()} wei`);
        
        // Create contract instance
        const contract = new Contract([], config.contractAddress, provider);
        contract.connect(account);
        
        console.log('✅ Integration test passed!');
        console.log('\nYour StarkNet Sepolia integration is working correctly.');
        
    } catch (error) {
        console.log('❌ Integration test failed:', error.message);
        process.exit(1);
    }
}

quickTest();