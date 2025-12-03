#!/usr/bin/env node

const { RpcProvider, Account, CallData, ec, hash, typedData } = require('starknet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('Manual Deployment with Original Class Hash');
console.log('====================================');

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

// Configuration
const config = {
    rpcUrl: process.env.L2_RPC_ENDPOINT || 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/21xJKr6s7H7ynN5UxElPx',
    accountAddress: process.env.STARKNET_ACCOUNT_ADDRESS,
    privateKey: process.env.STARKNET_PRIVATE_KEY
};

// Original class hash that was used to generate the account
const ORIGINAL_ACCOUNT_CLASS_HASH = '0x0490400477682342b77245100265dc5a4943df1bc6f4bd9508009e9f7c0500a0';

async function manualDeploy() {
    try {
        console.log('\n1. Loading existing account...');
        
        // Initialize provider
        const provider = new RpcProvider({
            nodeUrl: config.rpcUrl
        });

        // Check connection
        console.log('Checking RPC connection...');
        const chainId = await provider.getChainId();
        console.log(`Connected to StarkNet (Chain ID: ${chainId})`);

        // Derive public key from private key
        console.log('Deriving public key from private key...');
        const publicKey = ec.starkCurve.getStarkKey(config.privateKey);
        console.log(`Public key: ${publicKey}`);

        // Create account instance
        console.log('\n2. Creating account instance...');
        const account = new Account({
            provider,
            address: config.accountAddress,
            pk: config.privateKey
        });
        console.log('✅ Account instance created successfully');

        // Check if account is already deployed
        console.log('\nChecking if account is already deployed...');
        try {
            const nonce = await account.getNonce();
            console.log(`✅ Account is already deployed (nonce: ${nonce})`);
            console.log('No deployment needed.');
            return;
        } catch (error) {
            console.log('Account is not deployed yet, proceeding with deployment...');
        }

        // Prepare constructor calldata
        const constructorCallData = CallData.compile({ publicKey });
        console.log(`Constructor calldata: ${JSON.stringify(constructorCallData)}`);

        // Try to deploy using the original class hash directly
        console.log('\n3. Attempting deployment with original class hash...');
        console.log(`Class Hash: ${ORIGINAL_ACCOUNT_CLASS_HASH}`);
        console.log(`Address Salt: ${publicKey}`);
        
        try {
            const deployResponse = await account.deployAccount({
                classHash: ORIGINAL_ACCOUNT_CLASS_HASH,
                constructorCalldata: constructorCallData,
                addressSalt: publicKey
            }, {
                maxFee: BigInt(1000000000000000) // 0.001 ETH
            });

            console.log('✅ Deployment transaction sent successfully!');
            console.log(`Transaction Hash: ${deployResponse.transaction_hash}`);
            console.log(`Account Address: ${deployResponse.contract_address}`);

            // Wait for transaction confirmation
            console.log('\nWaiting for transaction confirmation...');
            const receipt = await provider.waitForTransaction(deployResponse.transaction_hash);
            console.log(`Transaction Status: ${receipt.status}`);
            
            if (receipt.status === 'ACCEPTED_ON_L2' || receipt.status === 'ACCEPTED_ON_L1') {
                console.log('🎉 Account deployed successfully!');
                console.log(`\nDeployment Summary:`);
                console.log(`  Account Address: ${deployResponse.contract_address}`);
                console.log(`  Transaction Hash: ${deployResponse.transaction_hash}`);
                console.log(`  StarkScan URL: https://sepolia.starkscan.co/tx/${deployResponse.transaction_hash}`);
            } else {
                console.log(`⚠️  Deployment completed with status: ${receipt.status}`);
            }
        } catch (deployError) {
            console.log('❌ Deployment failed with original class hash:');
            console.log(`Error: ${deployError.message}`);
            
            // If the original class hash fails, let's explain why and what to do
            if (deployError.message.includes('Class hash not found')) {
                console.log('\n🔧 Explanation:');
                console.log('The original account class hash is no longer available on the network.');
                console.log('This is a common issue during StarkNet network upgrades.');
                console.log('\nOptions:');
                console.log('1. Wait for the network to restore the original class hash (may take days/weeks)');
                console.log('2. Generate a new account with an available class hash');
                console.log('3. Contact StarkNet support for migration assistance');
                console.log('\nYour funds are safe - they are associated with your account address.');
                console.log('You just need to deploy the account contract to access them.');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Error stack:', error.stack);
    }
}

// Run the deployment
manualDeploy();