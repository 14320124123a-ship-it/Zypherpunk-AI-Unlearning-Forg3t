#!/usr/bin/env node

const { RpcProvider, Account, CallData, hash, ec } = require('starknet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('Manual Account Deployment (Starknet.js v8)');
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

// Configuration
const config = {
    rpcUrl: 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/21xJKr6s7H7ynN5UxElPx',
    accountAddress: process.env.STARKNET_ACCOUNT_ADDRESS,
    privateKey: process.env.STARKNET_PRIVATE_KEY
};

const OZ_ACCOUNT_CLASS_HASH = '0x0490400477682342b77245100265dc5a4943df1bc6f4bd9508009e9f7c0500a0';

async function manualDeploy() {
    try {
        console.log('\nInitializing provider with Alchemy RPC...');
        const provider = new RpcProvider({ nodeUrl: config.rpcUrl });
        
        // Check connection
        const chainId = await provider.getChainId();
        console.log(`Connected to network (Chain ID: ${chainId})`);

        // Derive public key from private key
        const publicKey = ec.starkCurve.getStarkKey(config.privateKey);
        console.log(`Derived public key: ${publicKey}`);

        // Prepare constructor calldata
        const constructorCallData = CallData.compile({ publicKey });
        console.log(`Constructor calldata: ${JSON.stringify(constructorCallData)}`);
        
        // Verify address calculation
        const calculatedAddress = hash.calculateContractAddressFromHash(
            publicKey,
            OZ_ACCOUNT_CLASS_HASH,
            constructorCallData,
            0 // salt
        );
        
        console.log(`\nAddress verification:`);
        console.log(`  Expected: ${config.accountAddress}`);
        console.log(`  Calculated: ${calculatedAddress}`);
        console.log(`  Match: ${config.accountAddress === calculatedAddress ? '✅ YES' : '❌ NO'}`);

        // Create account instance (v8 syntax)
        console.log('\nCreating account instance...');
        const account = new Account({
            provider,
            address: config.accountAddress,
            pk: config.privateKey
        });
        
        console.log('\nAttempting to deploy account contract...');
        console.log('This should work even if the account is not yet deployed.');
        
        // Try to deploy the account
        try {
            const deployResponse = await account.deployAccount({
                classHash: OZ_ACCOUNT_CLASS_HASH,
                constructorCalldata: constructorCallData,
                addressSalt: publicKey
            }, {
                maxFee: BigInt(1000000000000000) // 0.001 ETH
            });
            
            console.log(`✅ Account deployment transaction submitted: ${deployResponse.transaction_hash}`);
            console.log('Waiting for confirmation...');
            
            // Wait for transaction to be confirmed
            const receipt = await provider.waitForTransaction(deployResponse.transaction_hash);
            console.log(`Transaction status: ${receipt.status}`);
            
            if (receipt.status === 'ACCEPTED_ON_L2' || receipt.status === 'ACCEPTED_ON_L1') {
                console.log('🎉 Account deployed successfully!');
                console.log(`Account address: ${deployResponse.contract_address}`);
                console.log(`Transaction: https://sepolia.starkscan.co/tx/${deployResponse.transaction_hash}`);
            } else {
                console.log(`⚠️  Deployment completed with status: ${receipt.status}`);
            }
        } catch (deployError) {
            console.log('❌ Account deployment failed:', deployError.message);
            
            // Check if it's a specific error we can handle
            if (deployError.message.includes('version')) {
                console.log('\nThis appears to be a transaction version compatibility issue.');
                console.log('The RPC endpoint may not support the transaction version we are using.');
            } else if (deployError.message.includes('fee')) {
                console.log('\nThis appears to be a fee estimation issue.');
                console.log('Try adjusting the maxFee parameter.');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Error details:', error);
    }
    
    console.log(`\n📊 View your account on StarkScan: https://sepolia.starkscan.co/contract/${config.accountAddress}`);
}

manualDeploy();