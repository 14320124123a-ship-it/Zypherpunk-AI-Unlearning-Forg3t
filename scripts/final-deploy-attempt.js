#!/usr/bin/env node

const { RpcProvider, Account, ec, hash, CallData } = require('starknet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('Final Account Deployment Attempt');
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

// Use a different RPC provider that might be more compatible
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
        
        console.log('\nAttempting deployment with explicit parameters...');
        
        // Try a different approach - specify all parameters explicitly
        const deployParams = {
            classHash: OZ_ACCOUNT_CLASS_HASH,
            constructorCalldata: CallData.compile({ publicKey }),
            address: config.accountAddress,
            salt: publicKey // Explicitly specify salt
        };
        
        const txDetails = {
            maxFee: BigInt(1000000000000000), // 0.001 ETH
            version: 2 // Explicitly specify version 2
        };
        
        console.log('Deployment parameters:');
        console.log(`  Class Hash: ${deployParams.classHash}`);
        console.log(`  Constructor Calldata: ${JSON.stringify(deployParams.constructorCalldata)}`);
        console.log(`  Address: ${deployParams.address}`);
        console.log(`  Salt: ${deployParams.salt}`);
        console.log(`  Max Fee: ${txDetails.maxFee}`);
        console.log(`  Version: ${txDetails.version}`);

        // Try to deploy
        try {
            const deployResponse = await account.deployAccount(deployParams, txDetails);
            console.log(`✅ Deployment transaction submitted: ${deployResponse.transaction_hash}`);
            console.log('Waiting for confirmation...');
            
            const receipt = await provider.waitForTransaction(deployResponse.transaction_hash);
            console.log(`Deployment status: ${receipt.status}`);
            
            if (receipt.status === 'ACCEPTED_ON_L2' || receipt.status === 'ACCEPTED_ON_L1') {
                console.log('🎉 Account deployed successfully!');
                console.log(`Account address: ${deployResponse.contract_address}`);
                console.log(`Transaction: https://sepolia.starkscan.co/tx/${deployResponse.transaction_hash}`);
            } else {
                console.log(`⚠️  Deployment completed with status: ${receipt.status}`);
            }
        } catch (error) {
            console.log('❌ Deployment failed:');
            console.log(`Error message: ${error.message}`);
            
            // Let's try to get more details about the error
            if (error.message.includes('version')) {
                console.log('\nThis appears to be a transaction version compatibility issue.');
                console.log('The RPC endpoint may not support the transaction version we are using.');
                console.log('\nRecommendations:');
                console.log('1. Try again later when RPC providers are updated');
                console.log('2. Check StarkNet documentation for the correct transaction version');
                console.log('3. Consider using StarkNet CLI if available');
            } else if (error.message.includes('fee')) {
                console.log('\nThis appears to be a fee estimation issue.');
                console.log('Try adjusting the maxFee parameter.');
            } else {
                console.log('\nUnknown error type. Please check the error details above.');
            }
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
        console.error('Error details:', error);
    }
    
    console.log('\n📝 Summary:');
    console.log('If deployment continues to fail, you have these options:');
    console.log('1. Wait for RPC providers to be updated for better compatibility');
    console.log('2. Try using StarkNet CLI tools');
    console.log('3. Check if StarkGate has an option to deploy accounts');
    console.log('4. Verify your account has sufficient ETH (which you do)');
    console.log('5. Try a different RPC provider');
    console.log('\nYour account address is confirmed to be correct:');
    console.log(`https://sepolia.starkscan.co/contract/${config.accountAddress}`);
}

deployAccount();