#!/usr/bin/env node

const { RpcProvider, ec, hash, CallData, stark, num, typedData } = require('starknet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('Manual StarkNet Account Deployment');
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

        // Prepare constructor calldata
        const constructorCallData = CallData.compile({ publicKey });
        console.log(`Constructor calldata: ${JSON.stringify(constructorCallData)}`);

        // Calculate contract address (should match our account address)
        const calculatedAddress = hash.calculateContractAddressFromHash(
            publicKey,
            OZ_ACCOUNT_CLASS_HASH,
            constructorCallData,
            0 // salt
        );
        console.log(`Calculated address: ${calculatedAddress}`);
        console.log(`Expected address: ${config.accountAddress}`);
        
        if (calculatedAddress !== config.accountAddress) {
            console.log('⚠️  Calculated address does not match expected address!');
            return;
        }

        // For now, let's just log what we would need to do
        console.log('\nTo deploy this account, you would need to:');
        console.log('1. Construct a DEPLOY_ACCOUNT transaction with the following parameters:');
        console.log(`   - class_hash: ${OZ_ACCOUNT_CLASS_HASH}`);
        console.log(`   - contract_address_salt: ${publicKey}`);
        console.log(`   - constructor_calldata: ${JSON.stringify(constructorCallData)}`);
        console.log('2. Sign the transaction with your private key');
        console.log('3. Submit the transaction to the network using starknet_addDeployAccountTransaction');

        console.log('\nSince we are having RPC compatibility issues, you have a few options:');
        console.log('1. Use the StarkNet CLI tool if you have it installed');
        console.log('2. Use a different RPC provider that supports the required methods');
        console.log('3. Wait for the RPC providers to be updated');
        console.log('4. Try deploying through StarkGate website if they support account deployment');

        console.log('\nYou can also check your account status on StarkScan:');
        console.log(`https://sepolia.starkscan.co/contract/${config.accountAddress}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Error details:', error);
    }
}

deployAccount();