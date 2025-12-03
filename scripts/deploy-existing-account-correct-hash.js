#!/usr/bin/env node

const { RpcProvider, Account, CallData, ec, hash } = require('starknet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('Deploying Existing StarkNet Account (Correct Class Hash)');
console.log('================================================');

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

// Correct OpenZeppelin account class hash for StarkNet Sepolia (v0.6.1)
const OZ_ACCOUNT_CLASS_HASH = '0x033434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2';

async function deployAccount() {
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

        // Verify address calculation
        console.log('Verifying account address calculation...');
        const constructorCallData = CallData.compile({ publicKey });
        const calculatedAddress = hash.calculateContractAddressFromHash(
            publicKey,
            OZ_ACCOUNT_CLASS_HASH,
            constructorCallData,
            0 // salt
        );
        
        console.log(`Expected address: ${config.accountAddress}`);
        console.log(`Calculated address: ${calculatedAddress}`);
        
        if (config.accountAddress !== calculatedAddress) {
            console.log('❌ Address mismatch! Aborting deployment.');
            process.exit(1);
        }
        console.log('✅ Address verification passed');

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

        // Generate account deployment transaction
        console.log('\n3. Generating account deployment transaction...');
        const deployPayload = {
            classHash: OZ_ACCOUNT_CLASS_HASH,
            constructorCalldata: constructorCallData,
            addressSalt: publicKey
        };
        
        console.log('Deployment parameters:');
        console.log(`  Class Hash: ${deployPayload.classHash}`);
        console.log(`  Address Salt: ${deployPayload.addressSalt}`);
        console.log(`  Constructor Calldata: ${JSON.stringify(deployPayload.constructorCalldata)}`);

        // Send the deployment transaction
        console.log('\n4. Sending deployment transaction...');
        const deployResponse = await account.deployAccount(deployPayload, {
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

    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        console.error('Error stack:', error.stack);
        
        // Provide specific troubleshooting steps
        if (error.message.includes('Class hash not found')) {
            console.log('\n🔧 Troubleshooting:');
            console.log('The account class hash may not be available on the current network.');
            console.log('Try using a different RPC endpoint or wait for network updates.');
        } else if (error.message.includes('Contract not found')) {
            console.log('\n🔧 Troubleshooting:');
            console.log('This is expected for undeployed accounts.');
            console.log('The deployment should still work despite this error.');
        }
    }
}

// Run the deployment
deployAccount();