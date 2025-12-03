#!/usr/bin/env node

const { RpcProvider, Account, ec, hash, CallData } = require('starknet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('Checking if Account is Already Deployed');
console.log('====================================');

// Load environment variables
const envTestnetPath = path.join(__dirname, '..', '.env.testnet');
if (fs.existsSync(envTestnetPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envTestnetPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
    console.log(`Using account: ${process.env.STARKNET_ACCOUNT_ADDRESS}`);
} else {
    console.log('⚠️  .env.testnet file not found');
    process.exit(1);
}

// Use Alchemy RPC endpoint
const config = {
    rpcUrl: 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/21xJKr6s7H7ynN5UxElPx',
    accountAddress: process.env.STARKNET_ACCOUNT_ADDRESS,
    privateKey: process.env.STARKNET_PRIVATE_KEY
};

async function checkIfDeployed() {
    try {
        console.log('\nInitializing provider with Alchemy RPC...');
        const provider = new RpcProvider({ nodeUrl: config.rpcUrl });
        
        // Check connection
        const chainId = await provider.getChainId();
        console.log(`Connected to network (Chain ID: ${chainId})`);

        // Create account instance
        const account = new Account(provider, config.accountAddress, config.privateKey);
        
        console.log('\nTrying to get account nonce...');
        try {
            const nonce = await account.getNonce();
            console.log(`✅ Account IS deployed! Nonce: ${nonce}`);
            console.log('You can now proceed with contract deployment.');
            return true;
        } catch (error) {
            console.log('❌ Account is NOT deployed yet.');
            console.log('Error details:', error.message);
            return false;
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

checkIfDeployed();