#!/usr/bin/env node

const { RpcProvider, Account, ec, hash, CallData } = require('starknet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('Simple StarkNet Account Deployment');
console.log('================================');

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

// Configuration
const config = {
    rpcUrl: 'https://starknet-sepolia.drpc.org',
    accountAddress: process.env.STARKNET_ACCOUNT_ADDRESS,
    privateKey: process.env.STARKNET_PRIVATE_KEY
};

const OZ_ACCOUNT_CLASS_HASH = '0x0490400477682342b77245100265dc5a4943df1bc6f4bd9508009e9f7c0500a0';

async function deployAccount() {
    try {
        console.log('\nInitializing provider...');
        const provider = new RpcProvider({ nodeUrl: config.rpcUrl });
        
        // Check connection
        const chainId = await provider.getChainId();
        console.log(`Connected to network (Chain ID: ${chainId})`);

        // Derive public key
        const publicKey = ec.starkCurve.getStarkKey(config.privateKey);
        console.log(`Derived public key: ${publicKey}`);

        // Create account instance
        const account = new Account(provider, config.accountAddress, config.privateKey);
        
        console.log('\nPreparing deployment...');
        
        // Simple deployment with minimal parameters
        const deployResponse = await account.deployAccount({
            classHash: OZ_ACCOUNT_CLASS_HASH,
            constructorCalldata: CallData.compile({ publicKey }),
            address: config.accountAddress
        });

        console.log(`Deployment transaction hash: ${deployResponse.transaction_hash}`);
        console.log('Waiting for confirmation...');
        
        const receipt = await provider.waitForTransaction(deployResponse.transaction_hash);
        console.log(`Deployment status: ${receipt.status}`);
        
        if (receipt.status === 'ACCEPTED_ON_L2' || receipt.status === 'ACCEPTED_ON_L1') {
            console.log('✅ Account deployed successfully!');
            console.log(`Account address: ${deployResponse.contract_address}`);
        } else {
            console.log(`⚠️  Deployment completed with status: ${receipt.status}`);
        }

    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        console.error('Error details:', error);
    }
}

deployAccount();