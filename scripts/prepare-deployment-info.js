#!/usr/bin/env node

const { ec, hash, CallData } = require('starknet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('Preparing Account Deployment Information');
console.log('==================================');

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
    accountAddress: process.env.STARKNET_ACCOUNT_ADDRESS,
    privateKey: process.env.STARKNET_PRIVATE_KEY
};

const OZ_ACCOUNT_CLASS_HASH = '0x0490400477682342b77245100265dc5a4943df1bc6f4bd9508009e9f7c0500a0';

async function prepareDeploymentInfo() {
    try {
        console.log('\nDeriving keys and preparing deployment information...');
        
        // Derive public key from private key
        const publicKey = ec.starkCurve.getStarkKey(config.privateKey);
        console.log(`✅ Derived public key: ${publicKey}`);

        // Prepare constructor calldata
        const constructorCallData = CallData.compile({ publicKey });
        console.log(`✅ Constructor calldata: ${JSON.stringify(constructorCallData)}`);

        // Verify address calculation
        const calculatedAddress = hash.calculateContractAddressFromHash(
            publicKey,
            OZ_ACCOUNT_CLASS_HASH,
            constructorCallData,
            0 // salt
        );
        
        console.log(`\n📍 Address Verification:`);
        console.log(`   Expected Address: ${config.accountAddress}`);
        console.log(`   Calculated Address: ${calculatedAddress}`);
        console.log(`   Match: ${config.accountAddress === calculatedAddress ? '✅ YES' : '❌ NO'}`);

        // Prepare deployment parameters
        console.log(`\n📋 Deployment Parameters:`);
        console.log(`   Class Hash: ${OZ_ACCOUNT_CLASS_HASH}`);
        console.log(`   Public Key: ${publicKey}`);
        console.log(`   Salt: ${publicKey}`);
        console.log(`   Constructor Calldata: ${JSON.stringify(constructorCallData)}`);
        
        // Transaction details
        console.log(`\n📝 Transaction Details:`);
        console.log(`   Type: DEPLOY_ACCOUNT`);
        console.log(`   Version: 0x2`);
        console.log(`   Max Fee: 0x38d7ea4c68000 (0.001 ETH)`);
        console.log(`   Chain ID: 0x534e5f5345504f4c4941 (SN_SEPOLIA)`);
        console.log(`   Nonce: 0x0`);
        
        console.log(`\n🔧 To deploy this account, you would need to:`);
        console.log(`   1. Sign the deployment transaction with your private key`);
        console.log(`   2. Submit it using starknet_addDeployAccountTransaction RPC method`);
        
        console.log(`\n📊 Account Information:`);
        console.log(`   Account Address: ${config.accountAddress}`);
        console.log(`   Balance: 0.049939 ETH`);
        console.log(`   StarkScan: https://sepolia.starkscan.co/contract/${config.accountAddress}`);
        
        console.log(`\n💡 Next Steps:`);
        console.log(`   Since we're having RPC compatibility issues, try one of these:`);
        console.log(`   1. Wait a day or two for RPC providers to be updated`);
        console.log(`   2. Try using StarkNet CLI tools if available`);
        console.log(`   3. Check if StarkGate has an option to deploy accounts`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Error details:', error);
    }
}

prepareDeploymentInfo();