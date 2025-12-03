#!/usr/bin/env node

const { RpcProvider, ec, hash, CallData, stark, num, typedData } = require('starknet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('Raw StarkNet Account Deployment');
console.log('============================');

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

const OZ_ACCOUNT_CLASS_HASH = '0x0490400477682342b77245100265dc5a4943df1bc6f4bd9508009e9f7c0500a0';

async function deployAccount() {
    try {
        console.log('\nInitializing provider with Alchemy RPC...');
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

        // For now, let's just show what the raw transaction would look like
        console.log('\nRaw DEPLOY_ACCOUNT transaction would look like:');
        console.log('{');
        console.log('  "type": "DEPLOY_ACCOUNT",');
        console.log(`  "class_hash": "${OZ_ACCOUNT_CLASS_HASH}",`);
        console.log(`  "contract_address_salt": "${publicKey}",`);
        console.log(`  "constructor_calldata": ${JSON.stringify(constructorCallData)},`);
        console.log('  "version": "0x2",');
        console.log('  "nonce": "0x0",');
        console.log('  "max_fee": "0x38d7ea4c68000"  // 0.001 ETH');
        console.log('}');
        
        console.log('\nTo manually deploy this account, you would need to:');
        console.log('1. Sign this transaction with your private key');
        console.log('2. Submit it using starknet_addDeployAccountTransaction RPC method');
        
        console.log('\nSince we are having compatibility issues with the current RPC endpoints,');
        console.log('I recommend trying one of these alternatives:');
        console.log('1. Use the StarkNet CLI tool if available');
        console.log('2. Try again later when RPC providers are updated');
        console.log('3. Check if StarkGate has an option to deploy your account');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Error details:', error);
    }
}

deployAccount();