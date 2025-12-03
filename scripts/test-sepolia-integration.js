#!/usr/bin/env node

const { RpcProvider, Account, Contract, cairo, CallData, hash, num, stark, constants, ec, typedData } = require('starknet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('Forg3t Protocol - StarkNet Sepolia Integration');
console.log('=============================================');

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
} else {
    console.log('⚠️  .env.testnet file not found');
}

// Check if required environment variables are set
const requiredEnvVars = ['STARKNET_ACCOUNT_ADDRESS', 'STARKNET_PRIVATE_KEY', 'ALCHEMY_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.log('❌ Missing required environment variables:');
    missingEnvVars.forEach(envVar => console.log(`   - ${envVar}`));
    console.log('\nPlease set these variables in your .env.testnet file or environment.');
    process.exit(1);
}

// Configuration using your successful deployment details
const config = {
    rpcUrl: `https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/${process.env.ALCHEMY_API_KEY}`,
    accountAddress: process.env.STARKNET_ACCOUNT_ADDRESS,
    privateKey: process.env.STARKNET_PRIVATE_KEY,
    // Using your successfully deployed contract details
    contractAddress: '0x02f797a15292f9859f7d5fb76847b41bbd2778c35570f68af8e25a669c16bf3d',
    classHash: '0x15e37e3eec23a33181ae73fed007c0ffca5c0017e326827b5259a7ddbcca6e2'
};

async function interactWithContract() {
    try {
        console.log('\n🔍 Initializing connection to StarkNet Sepolia...');
        console.log(`   RPC URL: ${config.rpcUrl}`);
        console.log(`   Account Address: ${config.accountAddress}`);
        console.log(`   Contract Address: ${config.contractAddress}`);

        // Initialize provider
        const provider = new RpcProvider({
            nodeUrl: config.rpcUrl
        });

        // Check connection
        console.log('\n🔗 Checking RPC connection...');
        try {
            const chainId = await provider.getChainId();
            console.log(`   Chain ID: ${chainId}`);
        } catch (connectionError) {
            console.log('❌ Failed to connect to RPC endpoint');
            console.log(`   Error: ${connectionError.message}`);
            process.exit(1);
        }

        // Create account instance
        console.log('\n🔐 Creating account instance...');
        const account = new Account(provider, config.accountAddress, config.privateKey);

        // Check account balance
        console.log('\n💰 Checking account balance...');
        try {
            const balance = await provider.getBalance(config.accountAddress);
            console.log(`   Balance: ${balance.toString()} wei`);
        } catch (balanceError) {
            console.log('⚠️  Could not fetch account balance:', balanceError.message);
        }

        // Create contract instance
        console.log('\n📄 Creating contract instance...');
        // Simple counter contract ABI based on your successful deployment
        const contractAbi = [
            {
                "name": "increase",
                "type": "function",
                "inputs": [
                    {
                        "name": "amount",
                        "type": "core::integer::u128"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "name": "get",
                "type": "function",
                "inputs": [],
                "outputs": [
                    {
                        "type": "core::integer::u128"
                    }
                ],
                "state_mutability": "view"
            }
        ];

        const contract = new Contract(contractAbi, config.contractAddress, provider);
        contract.connect(account);

        // Read current counter value
        console.log('\n🔢 Reading current counter value...');
        try {
            const currentValue = await contract.get();
            console.log(`   Current value: ${currentValue.toString()}`);
        } catch (readError) {
            console.log('❌ Failed to read counter value:', readError.message);
        }

        // Increase counter by 5 (as in your successful test)
        console.log('\n⬆️  Increasing counter by 5...');
        try {
            const { transaction_hash } = await contract.increase(5);
            console.log(`   Transaction hash: ${transaction_hash}`);
            
            // Wait for transaction to be confirmed
            console.log('   Waiting for confirmation...');
            const receipt = await provider.waitForTransaction(transaction_hash);
            console.log('✅ Transaction confirmed');
            console.log(`   Final status: ${receipt.status}`);
            
            // Read new counter value
            console.log('\n🔢 Reading new counter value...');
            const newValue = await contract.get();
            console.log(`   New value: ${newValue.toString()}`);
            console.log('✅ Counter successfully increased!');
            
        } catch (invokeError) {
            console.log('❌ Failed to increase counter:', invokeError.message);
        }

        console.log('\n✅ Integration test completed successfully!');
        
    } catch (error) {
        console.log('❌ Error in integration test:', error.message);
        process.exit(1);
    }
}

// Run the integration
interactWithContract();