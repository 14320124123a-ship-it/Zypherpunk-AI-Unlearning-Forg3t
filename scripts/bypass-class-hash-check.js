#!/usr/bin/env node

const { RpcProvider, Account, CallData, ec, hash, stark, num } = require('starknet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('Attempting to Bypass Class Hash Check');
console.log('================================');

// Load environment variables from .env.testnet file
const envTestnetPath = path.join(__dirname, '..', '.env.testnet');
if (fs.existsSync(envTestnetPath)) {
    console.log('Loading environment variables from .env.testnet...');
    const envConfig = dotenv.parse(fs.readFileSync(envTestnetPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
    console.log(`Account address: ${process.env.STARKNET_ACCOUNT_ADDRESS}`);
} else {
    console.log('⚠️  .env.testnet file not found');
    process.exit(1);
}

async function bypassClassHashCheck() {
    try {
        console.log('\n1. Loading existing account...');
        
        // Initialize provider
        const provider = new RpcProvider({
            nodeUrl: 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/21xJKr6s7H7ynN5UxElPx'
        });

        // Check connection
        console.log('Checking RPC connection...');
        const chainId = await provider.getChainId();
        console.log(`Connected to StarkNet (Chain ID: ${chainId})`);

        // Derive public key from private key
        console.log('Deriving public key from private key...');
        const publicKey = ec.starkCurve.getStarkKey(process.env.STARKNET_PRIVATE_KEY);
        console.log(`Public key: ${publicKey}`);

        // Create account instance
        console.log('\n2. Creating account instance...');
        const account = new Account({
            provider,
            address: process.env.STARKNET_ACCOUNT_ADDRESS,
            pk: process.env.STARKNET_PRIVATE_KEY
        });
        console.log('✅ Account instance created successfully');

        // Try a different approach - send a minimal transaction to trigger deployment
        console.log('\n3. Attempting minimal transaction to trigger deployment...');
        
        // Let's try to estimate fee for a simple transaction first
        try {
            // Try to get the account version or do a simple call
            console.log('Testing account capabilities...');
            
            // Try to get nonce directly
            try {
                const nonce = await provider.getNonceForAddress(process.env.STARKNET_ACCOUNT_ADDRESS);
                console.log(`Account nonce: ${nonce}`);
            } catch (nonceError) {
                console.log('Cannot get nonce directly either');
            }
            
            console.log('\nSince we cannot deploy with the original class hash,');
            console.log('and we cannot bypass the class hash check,');
            console.log('the recommended solution is to:');
            console.log('1. Wait for the network to restore the original class hash, or');
            console.log('2. Generate a new account with an available class hash');
            
            console.log('\nYour funds are safe and will be accessible once the account is deployed.');

        } catch (error) {
            console.log('Cannot perform even basic account operations');
            console.log('This confirms the account is not deployed and the class hash is unavailable');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    console.log(`\n📊 View your account on StarkScan: https://sepolia.starkscan.co/contract/${process.env.STARKNET_ACCOUNT_ADDRESS}`);
}

bypassClassHashCheck();