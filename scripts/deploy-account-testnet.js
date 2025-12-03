#!/usr/bin/env node

const { RpcProvider, Account, ec, hash, CallData, stark, num } = require('starknet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('Deploying StarkNet Account to Sepolia Testnet');
console.log('============================================');

// Load environment variables from .env.testnet file
const envTestnetPath = path.join(__dirname, '..', '.env.testnet');
console.log(`Looking for env file at: ${envTestnetPath}`);
if (fs.existsSync(envTestnetPath)) {
    console.log('Found .env.testnet file, loading...');
    const envConfig = dotenv.parse(fs.readFileSync(envTestnetPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
    console.log('Environment variables loaded:');
    console.log(`  STARKNET_ACCOUNT_ADDRESS: ${process.env.STARKNET_ACCOUNT_ADDRESS}`);
    console.log(`  STARKNET_PRIVATE_KEY: ${process.env.STARKNET_PRIVATE_KEY}`);
} else {
    console.log('⚠️  .env.testnet file not found');
    process.exit(1);
}

// Check if required environment variables are set
const requiredEnvVars = ['STARKNET_ACCOUNT_ADDRESS', 'STARKNET_PRIVATE_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.log('❌ Missing required environment variables:');
    missingEnvVars.forEach(envVar => console.log(`   - ${envVar}`));
    console.log('\nPlease set these variables in your .env file or environment.');
    process.exit(1);
}

// List of RPC providers to try
const rpcProviders = [
    'https://starknet-sepolia.public.blastapi.io',  // BlastAPI
    'https://free-rpc.nethermind.io/sepolia-juno/', // Nethermind
    'https://starknet-sepolia.infura.io/v3/your-infura-key', // Infura (replace with your key)
    'https://starknet-sepolia.drpc.org', // dRPC
    process.env.L2_RPC_ENDPOINT || 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/21xJKr6s7H7ynN5UxElPx' // Alchemy from env
];

// OpenZeppelin account class hash for StarkNet Sepolia
const OZ_ACCOUNT_CLASS_HASH = '0x0490400477682342b77245100265dc5a4943df1bc6f4bd9508009e9f7c0500a0';

async function deployAccount() {
    let provider;
    let workingRpcUrl = null;

    // Try to find a working RPC provider
    console.log('\n🔍 Testing RPC providers...');
    for (const rpcUrl of rpcProviders) {
        if (rpcUrl.includes('your-infura-key')) {
            console.log(`   Skipping Infura (requires API key): ${rpcUrl}`);
            continue;
        }
        
        console.log(`   Testing: ${rpcUrl}`);
        try {
            const testProvider = new RpcProvider({ nodeUrl: rpcUrl });
            const chainId = await testProvider.getChainId();
            console.log(`   ✅ Connected to ${rpcUrl} (Chain ID: ${chainId})`);
            provider = testProvider;
            workingRpcUrl = rpcUrl;
            break;
        } catch (error) {
            console.log(`   ❌ Failed to connect to ${rpcUrl}: ${error.message}`);
        }
    }

    if (!provider) {
        console.log('❌ No working RPC provider found');
        process.exit(1);
    }

    console.log(`\n🔧 Using RPC provider: ${workingRpcUrl}`);

    // Configuration
    const config = {
        rpcUrl: workingRpcUrl,
        accountAddress: process.env.STARKNET_ACCOUNT_ADDRESS,
        privateKey: process.env.STARKNET_PRIVATE_KEY
    };

    try {
        console.log('\n🔍 Checking environment...');
        console.log(`   Account Address: ${config.accountAddress}`);

        // Derive public key from private key
        console.log('\n🔐 Deriving public key...');
        const publicKey = ec.starkCurve.getStarkKey(config.privateKey);
        console.log(`   Public Key: ${publicKey}`);

        // Create a temporary account instance for deployment
        const account = new Account(provider, config.accountAddress, config.privateKey);

        // Check if account is already deployed
        console.log('\n🔎 Checking if account is already deployed...');
        try {
            const nonce = await account.getNonce();
            console.log(`   Account already deployed with nonce: ${nonce}`);
            console.log('✅ Account is already deployed!');
            return;
        } catch (error) {
            console.log('   Account not deployed yet, proceeding with deployment...');
        }

        // Prepare deployment parameters
        const constructorCallData = CallData.compile({ publicKey });
        const deployAccountPayload = {
            classHash: OZ_ACCOUNT_CLASS_HASH,
            constructorCalldata: constructorCallData,
            contractAddress: config.accountAddress,
            addressSalt: publicKey
        };

        // Estimate fee for the deployment
        console.log('\n💰 Estimating fee for account deployment...');
        let estimatedFee;
        try {
            estimatedFee = await account.estimateAccountDeployFee(deployAccountPayload);
            console.log(`   Estimated fee: ${estimatedFee.suggestedMaxFee.toString()} wei`);
        } catch (feeError) {
            console.log('   Could not estimate fee, using default fee');
            estimatedFee = { suggestedMaxFee: BigInt(1000000000000000) }; // 0.001 ETH
        }

        // Deploy the account with explicit version 2
        console.log('\n🚀 Deploying account with explicit V2 transaction...');
        
        // Try to deploy with version 2 explicitly
        const accountResponse = await account.deployAccount(deployAccountPayload, {
            maxFee: estimatedFee.suggestedMaxFee,
            version: 2
        });

        console.log(`   Transaction hash: ${accountResponse.transaction_hash}`);
        console.log(`   Account address: ${accountResponse.contract_address}`);

        // Wait for deployment to be confirmed
        console.log('   Waiting for confirmation...');
        const deployReceipt = await provider.waitForTransaction(accountResponse.transaction_hash);
        console.log('✅ Account deployed successfully');
        console.log(`   Final status: ${deployReceipt.status}`);

        console.log('\n🎉 Account Deployment Summary');
        console.log('===========================');
        console.log(`   Account Address: ${accountResponse.contract_address}`);
        console.log(`   Deploy Transaction: ${accountResponse.transaction_hash}`);

        console.log('\n📋 Next steps:');
        console.log('   1. Your account is now deployed and ready to use');
        console.log('   2. You can now run the contract deployment script');
        console.log('   3. Test the complete flow');

    } catch (error) {
        console.error('❌ Account deployment failed:', error.message);
        console.error('Stack:', error.stack);
        
        // Provide troubleshooting steps
        console.log('\n🔧 Troubleshooting steps:');
        console.log('   1. Verify your account has sufficient ETH on StarkNet Sepolia');
        console.log('   2. Check that your RPC endpoint is working correctly');
        console.log('   3. Verify the private key format is correct');
        console.log('   4. Try using a different RPC provider');
        console.log('   5. Check StarkScan to verify your account exists: https://sepolia.starkscan.co/contract/' + config.accountAddress);
        
        process.exit(1);
    }
}

// Run the deployment
deployAccount();