#!/usr/bin/env node

const { RpcProvider, Account, Contract, cairo, CallData, hash, num, stark, constants, ec, typedData } = require('starknet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('StarkNet Sepolia Testnet Contract Deployment');
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

// Configuration
const config = {
    rpcUrl: process.env.L2_RPC_ENDPOINT || 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/21xJKr6s7H7ynN5UxElPx',
    accountAddress: process.env.STARKNET_ACCOUNT_ADDRESS,
    privateKey: process.env.STARKNET_PRIVATE_KEY,
    // Contract artifacts path
    sierraPath: path.join(__dirname, '..', 'cairo-contracts', 'target', 'dev', 'proof_registry_ProofRegistry.contract_class.json'),
    casmPath: path.join(__dirname, '..', 'cairo-contracts', 'target', 'dev', 'proof_registry_ProofRegistry.compiled_contract_class.json')
};

async function deployContract() {
    try {
        console.log('\n🔍 Checking environment...');
        console.log(`   RPC URL: ${config.rpcUrl}`);
        console.log(`   Account Address: ${config.accountAddress}`);

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
            
            // Try alternative RPC endpoints
            const alternativeEndpoints = [
                'https://free-rpc.nethermind.io/sepolia-juno/',
                'https://starknet-sepolia.public.blastapi.io',
                'https://rpc.starknet-testnet.lava.build'
            ];
            
            for (const endpoint of alternativeEndpoints) {
                console.log(`   Trying alternative endpoint: ${endpoint}`);
                try {
                    const altProvider = new RpcProvider({ nodeUrl: endpoint });
                    const chainId = await altProvider.getChainId();
                    console.log(`   Success with endpoint ${endpoint}, Chain ID: ${chainId}`);
                    // Update config to use this working endpoint
                    config.rpcUrl = endpoint;
                    provider.nodeUrl = endpoint;
                    break;
                } catch (altError) {
                    console.log(`   Failed with endpoint ${endpoint}: ${altError.message}`);
                }
            }
        }

        // Check if contract artifacts exist
        console.log('\n📂 Checking for compiled contract artifacts...');
        
        if (!fs.existsSync(config.sierraPath)) {
            console.log(`❌ Sierra artifact not found at: ${config.sierraPath}`);
            console.log('\n📝 To compile the contract, you need to:');
            console.log('   1. Install Scarb (https://docs.swmansion.com/scarb/)');
            console.log('   2. Run: cd cairo-contracts && scarb build');
            console.log('   3. Then run this script again');
            return;
        }

        if (!fs.existsSync(config.casmPath)) {
            console.log(`❌ CASM artifact not found at: ${config.casmPath}`);
            console.log('   This is required for contract deployment.');
            return;
        }

        console.log('✅ Found contract artifacts');

        // Read contract artifacts
        console.log('\n📖 Reading contract artifacts...');
        const sierra = JSON.parse(fs.readFileSync(config.sierraPath, 'utf8'));
        const casm = JSON.parse(fs.readFileSync(config.casmPath, 'utf8'));

        console.log('✅ Contract artifacts loaded');

        // Create account instance
        console.log('\n🔐 Creating account instance...');
        const account = new Account(provider, config.accountAddress, config.privateKey);

        // Try a simple balance check to verify account is working
        console.log('\n💰 Checking account balance...');
        try {
            const balance = await provider.getBalance(config.accountAddress);
            console.log(`   Balance: ${balance.toString()} wei`);
        } catch (balanceError) {
            console.log('⚠️  Could not fetch account balance:', balanceError.message);
        }

        // Check account nonce with different block identifiers
        console.log('\n🔢 Checking account nonce...');
        let nonce;
        const blockIds = ['latest', 'pending'];
        
        for (const blockId of blockIds) {
            try {
                nonce = await account.getNonce(blockId);
                console.log(`   Nonce (${blockId}): ${nonce}`);
                break;
            } catch (nonceError) {
                console.log(`   Failed to get nonce with block_id "${blockId}": ${nonceError.message}`);
            }
        }
        
        if (!nonce) {
            console.log('   Using default nonce calculation');
            nonce = await account.getNonce();
        }

        // Declare the contract using a simplified approach
        console.log('\n🚀 Declaring contract...');
        let declareResponse;
        
        try {
            // Try with zero fee first (some testnets allow this)
            declareResponse = await account.declare({
                contract: sierra,
                casm: casm
            }, { 
                maxFee: 0n,
                nonce: nonce
            });
            
            console.log(`   Transaction hash: ${declareResponse.transaction_hash}`);
            console.log(`   Class hash: ${declareResponse.class_hash}`);

            // Wait for declaration to be confirmed
            console.log('   Waiting for confirmation...');
            const receipt = await provider.waitForTransaction(declareResponse.transaction_hash);
            console.log('✅ Contract declared successfully');
            console.log(`   Final status: ${receipt.status}`);
        } catch (declareError) {
            console.log('❌ Contract declaration failed:');
            console.log(`   Error: ${declareError.message}`);
            
            // If zero fee fails, try with a very small fee
            try {
                console.log('   Trying with small fee...');
                declareResponse = await account.declare({
                    contract: sierra,
                    casm: casm
                }, { 
                    maxFee: BigInt(1000000000000000), // 0.001 ETH
                    nonce: nonce
                });
                
                console.log(`   Transaction hash: ${declareResponse.transaction_hash}`);
                console.log(`   Class hash: ${declareResponse.class_hash}`);
                
                // Wait for declaration to be confirmed
                console.log('   Waiting for confirmation...');
                const receipt = await provider.waitForTransaction(declareResponse.transaction_hash);
                console.log('✅ Contract declared successfully');
                console.log(`   Final status: ${receipt.status}`);
            } catch (manualError) {
                console.log('❌ Small fee declaration also failed:');
                console.log(`   Error: ${manualError.message}`);
                
                // Show detailed error information
                console.log('\n📝 Detailed error info:');
                console.log('   This might be due to:');
                console.log('   1. Account not funded properly');
                console.log('   2. RPC endpoint compatibility issues');
                console.log('   3. Starknet.js version incompatibility');
                console.log('   4. Network congestion');
                
                throw manualError;
            }
        }

        // Deploy the contract
        console.log('\n🏗️  Deploying contract...');
        const deployResponse = await account.deployContract({
            classHash: declareResponse.class_hash,
            constructorCalldata: CallData.compile([])
        }, { 
            maxFee: BigInt(1000000000000000), // 0.001 ETH
            nonce: nonce ? (BigInt(nonce) + 1n).toString() : undefined
        });

        console.log(`   Transaction hash: ${deployResponse.transaction_hash}`);
        console.log(`   Contract address: ${deployResponse.contract_address}`);

        // Wait for deployment to be confirmed
        console.log('   Waiting for confirmation...');
        const deployReceipt = await provider.waitForTransaction(deployResponse.transaction_hash);
        console.log('✅ Contract deployed successfully');
        console.log(`   Final status: ${deployReceipt.status}`);

        // Update .env.testnet with the new contract address
        console.log('\n💾 Updating .env.testnet file...');
        const envTestnetPath = path.join(__dirname, '..', '.env.testnet');
        
        if (fs.existsSync(envTestnetPath)) {
            let envContent = fs.readFileSync(envTestnetPath, 'utf8');
            // Replace the CONTRACT_ADDRESS line
            envContent = envContent.replace(
                /CONTRACT_ADDRESS=.*$/,
                `CONTRACT_ADDRESS=${deployResponse.contract_address}`
            );
            fs.writeFileSync(envTestnetPath, envContent);
            console.log('✅ .env.testnet updated with new contract address');
        } else {
            console.log('⚠️  .env.testnet file not found, skipping update');
        }

        console.log('\n🎉 Deployment Summary');
        console.log('====================');
        console.log(`   Contract Address: ${deployResponse.contract_address}`);
        console.log(`   Class Hash: ${declareResponse.class_hash}`);
        console.log(`   Declare Transaction: ${declareResponse.transaction_hash}`);
        console.log(`   Deploy Transaction: ${deployResponse.transaction_hash}`);

        console.log('\n📋 Next steps:');
        console.log('   1. Copy .env.testnet to backend-service/.env to use the testnet configuration');
        console.log('   2. Start the backend services');
        console.log('   3. Test the complete flow');

    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
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
deployContract();