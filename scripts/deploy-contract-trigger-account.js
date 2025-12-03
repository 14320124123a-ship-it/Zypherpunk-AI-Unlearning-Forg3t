#!/usr/bin/env node

const { RpcProvider, Account, Contract, cairo, CallData, hash, num, stark, constants, ec, typedData } = require('starknet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('Deploying ProofRegistry Contract (will trigger account deployment)');
console.log('================================================================');

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
    console.log(`  STARKNET_PRIVATE_KEY: ${process.env.STARKNET_PRIVATE_KEY.substring(0, 10)}...`);
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
    rpcUrl: process.env.L2_RPC_ENDPOINT || 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/21xJKr6s7H7ynN5UxElPx',
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
        const chainId = await provider.getChainId();
        console.log(`   Chain ID: ${chainId}`);

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

        // Check account balance
        console.log('\n💰 Checking account balance...');
        try {
            // Get the ETH token contract address on StarkNet Sepolia
            const ethTokenAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
            
            // Call the balanceOf function on the ETH contract
            const result = await provider.callContract({
                contractAddress: ethTokenAddress,
                entrypoint: 'balanceOf',
                calldata: [config.accountAddress]
            });
            
            // The result is an array, we need the first element
            const balance = BigInt(result[0]);
            const balanceEth = Number(balance) / 1e18;
            
            console.log(`   Balance: ${balance.toString()} wei (${balanceEth.toFixed(6)} ETH)`);
            
            if (balanceEth <= 0) {
                console.log('❌ Account has zero balance. Please bridge ETH from Ethereum Sepolia using StarkGate');
                console.log('   Visit: https://sepolia.starkgate.starknet.io/');
                process.exit(1);
            } else {
                console.log('✅ Account has sufficient balance for deployment');
            }
        } catch (balanceError) {
            console.log('⚠️  Could not fetch account balance:', balanceError.message);
            console.log('   Proceeding with deployment anyway...');
        }

        // Declare the contract
        console.log('\n🚀 Declaring contract (this will trigger account deployment if needed)...');
        let declareResponse;
        
        try {
            // Try with zero fee first (common on testnets)
            declareResponse = await account.declare({
                contract: sierra,
                casm: casm
            }, { 
                maxFee: 0n
            });
            
            console.log(`   Declaration transaction hash: ${declareResponse.transaction_hash}`);
            console.log(`   Class hash: ${declareResponse.class_hash}`);

            // Wait for declaration to be confirmed
            console.log('   Waiting for declaration confirmation...');
            const receipt = await provider.waitForTransaction(declareResponse.transaction_hash);
            console.log('✅ Contract declared successfully');
            console.log(`   Final status: ${receipt.status}`);
        } catch (declareError) {
            console.log('❌ Contract declaration failed:');
            console.log(`   Error: ${declareError.message}`);
            
            // If zero fee fails, try with a small fee
            try {
                console.log('   Trying with small fee...');
                declareResponse = await account.declare({
                    contract: sierra,
                    casm: casm
                }, { 
                    maxFee: BigInt(1000000000000000) // 0.001 ETH
                });
                
                console.log(`   Declaration transaction hash: ${declareResponse.transaction_hash}`);
                console.log(`   Class hash: ${declareResponse.class_hash}`);
                
                // Wait for declaration to be confirmed
                console.log('   Waiting for declaration confirmation...');
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
            maxFee: BigInt(1000000000000000) // 0.001 ETH
        });

        console.log(`   Deployment transaction hash: ${deployResponse.transaction_hash}`);
        console.log(`   Contract address: ${deployResponse.contract_address}`);

        // Wait for deployment to be confirmed
        console.log('   Waiting for deployment confirmation...');
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
        console.log(`   StarkScan URL: https://sepolia.starkscan.co/contract/${deployResponse.contract_address}`);

        console.log('\n📋 Next steps:');
        console.log('   1. Your account should now be deployed (automatically triggered)');
        console.log('   2. Copy .env.testnet to backend-service/.env to use the testnet configuration');
        console.log('   3. Start the backend services');
        console.log('   4. Test the complete flow');

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