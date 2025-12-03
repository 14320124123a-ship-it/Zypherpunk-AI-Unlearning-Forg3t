#!/usr/bin/env node

const { RpcProvider, Account } = require('starknet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('Checking Account Balance on StarkNet Sepolia');
console.log('===========================================');

// Load environment variables from .env.testnet file
const envTestnetPath = path.join(__dirname, '..', '.env.testnet');
if (fs.existsSync(envTestnetPath)) {
    console.log('Loading environment variables from .env.testnet...');
    const envConfig = dotenv.parse(fs.readFileSync(envTestnetPath));
    
    // Check if we have a valid RPC endpoint
    let rpcUrl = envConfig.L2_RPC_ENDPOINT;
    if (!rpcUrl || rpcUrl.includes('YOUR_')) {
        console.log('⚠️  No valid RPC endpoint found in .env.testnet');
        console.log('Please update L2_RPC_ENDPOINT with a valid StarkNet Sepolia RPC URL');
        console.log('See RPC_PROVIDER_FINDINGS.md for recommended providers');
        process.exit(1);
    }
    
    const accountAddress = envConfig.STARKNET_ACCOUNT_ADDRESS;
    const privateKey = envConfig.STARKNET_PRIVATE_KEY;
    
    console.log(`RPC URL: ${rpcUrl}`);
    console.log(`Account Address: ${accountAddress}`);
    
    // Initialize provider
    const provider = new RpcProvider({
        nodeUrl: rpcUrl
    });
    
    // Create account instance
    const account = new Account(provider, accountAddress, privateKey);
    
    // Check account balance
    account.getBalance().then(balance => {
        console.log(`\nAccount Balance: ${balance} wei`);
        console.log(`Account Balance: ${balance / 10n**18n} ETH`);
        
        if (balance > 0n) {
            console.log('✅ Account has funds - ready for deployment');
        } else {
            console.log('⚠️  Account has no funds - please add testnet ETH before deployment');
            console.log('Use StarkGate to bridge ETH from Ethereum Sepolia to StarkNet Sepolia');
        }
    }).catch(error => {
        console.error('Failed to check account balance:', error.message);
        console.log('This might be due to:');
        console.log('1. Invalid RPC endpoint');
        console.log('2. Network connectivity issues');
        console.log('3. Account not yet deployed (balance check will fail)');
        console.log('4. Invalid account address');
    });
} else {
    console.log('⚠️  .env.testnet file not found');
    console.log('Please create .env.testnet with your StarkNet Sepolia configuration');
}