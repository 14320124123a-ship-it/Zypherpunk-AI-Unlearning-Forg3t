#!/usr/bin/env node

const { ec, hash, CallData, Account, RpcProvider } = require('starknet');

console.log('Generating and Deploying New StarkNet Account');
console.log('========================================');

// Use the available OpenZeppelin 0.6.1 account class hash
const OZ_ACCOUNT_CLASS_HASH = '0x033434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2';

// Generate a new private key
console.log('\n1. Generating new account keys...');
const privateKey = ec.starkCurve.utils.randomPrivateKey();
const privateKeyHex = '0x' + privateKey.toString(16);

// Get the public key from the private key
const publicKey = ec.starkCurve.getStarkKey(privateKey);

// Calculate the account address using the available class hash
const accountAddress = hash.calculateContractAddressFromHash(
    publicKey,
    OZ_ACCOUNT_CLASS_HASH,
    [publicKey],
    0 // salt
);

console.log('✅ New account keys generated successfully!');
console.log('\nAccount Details:');
console.log('===============');
console.log('Account Address:', accountAddress);
console.log('Private Key:', privateKeyHex);
console.log('Public Key:', publicKey);

// Prepare constructor calldata
const constructorCallData = CallData.compile({ publicKey });
console.log('Constructor Calldata:', JSON.stringify(constructorCallData));

// Now deploy the account
console.log('\n2. Deploying new account to StarkNet Sepolia...');

async function deployAccount() {
    try {
        // Initialize provider
        const provider = new RpcProvider({
            nodeUrl: 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/21xJKr6s7H7ynN5UxElPx'
        });

        // Check connection
        console.log('Checking RPC connection...');
        const chainId = await provider.getChainId();
        console.log(`Connected to StarkNet (Chain ID: ${chainId})`);

        // Create account instance
        console.log('\nCreating account instance...');
        const account = new Account({
            provider,
            address: accountAddress,
            pk: privateKeyHex
        });
        console.log('✅ Account instance created successfully');

        // Deploy the account
        console.log('\nSending deployment transaction...');
        const deployResponse = await account.deployAccount({
            classHash: OZ_ACCOUNT_CLASS_HASH,
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
            
            console.log('\nNext Steps:');
            console.log('1. Send testnet ETH to this address using StarkGate');
            console.log('2. Once funded, you can use this account for your project');
            console.log('3. Update your .env.testnet file with these new credentials');
        } else {
            console.log(`⚠️  Deployment completed with status: ${receipt.status}`);
        }

    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        console.error('Error stack:', error.stack);
        
        console.log('\nDespite the deployment error, your account details are:');
        console.log('Account Address:', accountAddress);
        console.log('Private Key:', privateKeyHex);
        console.log('Public Key:', publicKey);
        console.log('Constructor Calldata:', JSON.stringify(constructorCallData));
        console.log('\nYou can try deploying again later or use these details to send ETH to the address.');
    }
}

// Run the deployment
deployAccount();