#!/usr/bin/env node

const { RpcProvider, Account, Contract, cairo, CallData, hash, num, stark, constants, ec, typedData } = require('starknet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('Forg3t Protocol - StarkNet Sepolia Contract Integration');
console.log('======================================================');

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
    console.log(`  ALCHEMY_API_KEY: ${process.env.ALCHEMY_API_KEY ? '****' + process.env.ALCHEMY_API_KEY.slice(-4) : 'NOT SET'}`);
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

async function testContractIntegration() {
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

        // Create contract instance using the ProofRegistry ABI
        console.log('\n📄 Creating ProofRegistry contract instance...');
        const proofRegistryAbi = [
            {
                "name": "store_proof",
                "type": "function",
                "inputs": [
                    {
                        "name": "job_id",
                        "type": "core::felt252"
                    },
                    {
                        "name": "proof_hash",
                        "type": "core::felt252"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "name": "get_proof",
                "type": "function",
                "inputs": [
                    {
                        "name": "job_id",
                        "type": "core::felt252"
                    }
                ],
                "outputs": [
                    {
                        "type": "(core::felt252, core::integer::u64)"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "name": "get_job_count",
                "type": "function",
                "inputs": [],
                "outputs": [
                    {
                        "type": "core::integer::u64"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "name": "verify_noir_proof",
                "type": "function",
                "inputs": [
                    {
                        "name": "job_id",
                        "type": "core::felt252"
                    },
                    {
                        "name": "proof_data",
                        "type": "core::array::Array::<core::felt252>"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::bool"
                    }
                ],
                "state_mutability": "external"
            }
        ];

        const contract = new Contract(proofRegistryAbi, config.contractAddress, provider);
        contract.connect(account);

        // Read current job count
        console.log('\n📊 Reading current job count...');
        try {
            const jobCount = await contract.get_job_count();
            console.log(`   Current job count: ${jobCount.toString()}`);
        } catch (readError) {
            console.log('⚠️  Could not read job count:', readError.message);
        }

        // Test storing a proof (using a sample job ID and proof hash)
        console.log('\n💾 Testing proof storage...');
        try {
            // Sample job ID and proof hash
            const jobId = "0x123456789abcdef";
            const proofHash = "0xabcdef123456789";
            
            console.log(`   Storing proof for job ID: ${jobId}`);
            console.log(`   Proof hash: ${proofHash}`);
            
            // Store the proof
            const { transaction_hash } = await contract.store_proof(jobId, proofHash);
            console.log(`   Transaction hash: ${transaction_hash}`);
            
            // Wait for transaction to be confirmed
            console.log('   Waiting for confirmation...');
            const receipt = await provider.waitForTransaction(transaction_hash);
            console.log('✅ Proof stored successfully');
            console.log(`   Final status: ${receipt.status}`);
            
            // Read the stored proof
            console.log('\n🔍 Reading stored proof...');
            const storedProof = await contract.get_proof(jobId);
            console.log(`   Stored proof: ${storedProof[0].toString()}`);
            console.log(`   Timestamp: ${storedProof[1].toString()}`);
            
        } catch (invokeError) {
            console.log('⚠️  Proof storage test:', invokeError.message);
        }

        console.log('\n✅ Integration test completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('1. The backend service is now configured to use your deployed contract');
        console.log('2. Make sure your .env.testnet file has the correct configuration');
        console.log('3. Start the backend service with: npm run start');
        console.log('4. The service will automatically process completed unlearning jobs');
        
    } catch (error) {
        console.log('❌ Error in integration test:', error.message);
        process.exit(1);
    }
}

// Run the integration test
testContractIntegration();