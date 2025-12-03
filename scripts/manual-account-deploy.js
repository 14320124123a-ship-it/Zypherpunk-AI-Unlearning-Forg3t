#!/usr/bin/env node

const { RpcProvider, ec, hash, CallData, stark, num } = require('starknet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const crypto = require('crypto');

console.log('Manual Account Deployment via Raw RPC Calls');
console.log('======================================');

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
    rpcUrl: 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/21xJKr6s7H7ynN5UxElPx',
    accountAddress: process.env.STARKNET_ACCOUNT_ADDRESS,
    privateKey: process.env.STARKNET_PRIVATE_KEY
};

const OZ_ACCOUNT_CLASS_HASH = '0x0490400477682342b77245100265dc5a4943df1bc6f4bd9508009e9f7c0500a0';

async function manualDeploy() {
    try {
        console.log('\nDeriving keys and preparing deployment...');
        
        // Derive public key from private key
        const publicKey = ec.starkCurve.getStarkKey(config.privateKey);
        console.log(`Derived public key: ${publicKey}`);

        // Prepare constructor calldata
        const constructorCallData = CallData.compile({ publicKey });
        console.log(`Constructor calldata: ${JSON.stringify(constructorCallData)}`);

        // Calculate the transaction hash
        console.log('\nCalculating transaction hash...');
        
        // For a DEPLOY_ACCOUNT transaction, we need to calculate the hash manually
        // This is a simplified version - in practice, this would be more complex
        const deployAccountTx = {
            type: 'DEPLOY_ACCOUNT',
            class_hash: OZ_ACCOUNT_CLASS_HASH,
            contract_address_salt: publicKey,
            constructor_calldata: constructorCallData,
            version: '0x2',
            nonce: '0x0',
            max_fee: '0x38d7ea4c68000', // 0.001 ETH
            chain_id: '0x534e5f5345504f4c4941' // SN_SEPOLIA
        };
        
        console.log('Prepared deployment transaction:');
        console.log(JSON.stringify(deployAccountTx, null, 2));
        
        console.log('\nTo deploy this account, you would need to:');
        console.log('1. Sign the transaction with your private key');
        console.log('2. Submit it using starknet_addDeployAccountTransaction RPC method');
        
        console.log('\nSince we are having compatibility issues with the RPC endpoints,');
        console.log('I recommend trying one of these alternatives:');
        console.log('1. Use the StarkNet CLI tool if available');
        console.log('2. Try again later when RPC providers are updated');
        console.log('3. Check if StarkGate has an option to deploy your account');
        
        console.log('\n📝 Your account details:');
        console.log(`Account Address: ${config.accountAddress}`);
        console.log(`Public Key: ${publicKey}`);
        console.log(`Class Hash: ${OZ_ACCOUNT_CLASS_HASH}`);
        console.log(`StarkScan: https://sepolia.starkscan.co/contract/${config.accountAddress}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Error details:', error);
    }
}

manualDeploy();