#!/usr/bin/env node

const { RpcProvider, Account, CallData } = require('starknet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('Deploying Account with New RPC Provider');
console.log('================================');

// Load environment variables from .env.testnet file
const envTestnetPath = path.join(__dirname, '..', '.env.testnet');
if (fs.existsSync(envTestnetPath)) {
    console.log('Loading environment variables from .env.testnet...');
    const envConfig = dotenv.parse(fs.readFileSync(envTestnetPath));
    
    // Check if we have a valid RPC endpoint
    let rpcUrl = envConfig.L2_RPC_ENDPOINT;
    if (!rpcUrl || rpcUrl.includes('YOUR_')) {
        console.log('⚠️  No valid RPC endpoint found in .env.testnet');
        console.log('Please update L2_RPC_ENDPOINT with a valid StarkNet Sepolia RPC URL');
        console.log('See RPC_PROVIDER_FINDINGS.md for recommended providers');
        process.exit(1);
    }
    
    const accountAddress = envConfig.STARKNET_ACCOUNT_ADDRESS;
    const privateKey = envConfig.STARKNET_PRIVATE_KEY;
    
    console.log(`RPC URL: ${rpcUrl}`);
    console.log(`Account Address: ${accountAddress}`);
    
    // Initialize provider
    const provider = new RpcProvider({
        nodeUrl: rpcUrl
    });
    
    // Create account instance
    const account = new Account(provider, accountAddress, privateKey);
    
    // Derive public key from private key
    const publicKey = account.signer.pk;
    console.log(`Public Key: ${publicKey}`);
    
    // Prepare constructor calldata
    const constructorCallData = CallData.compile([publicKey]);
    console.log(`Constructor Calldata: ${JSON.stringify(constructorCallData)}`);
    
    // Deploy account with zero fee
    console.log('\nSending deployment transaction with zero fee...');
    
    account.deployAccount({
        classHash: '0x033434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2', // OZ 0.6.1
        constructorCalldata: constructorCallData,
        addressSalt: publicKey
    }, {
        maxFee: 0n
    }).then(deployResponse => {
        console.log(`Transaction hash: ${deployResponse.transaction_hash}`);
        console.log('Deployment successful');
        console.log(`Account deployed: ${deployResponse.contract_address}`);
        console.log(`View on StarkScan: https://sepolia.starkscan.co/tx/${deployResponse.transaction_hash}`);
    }).catch(error => {
        console.error('Deployment failed:', error.message);
        
        // If zero fee fails, try with small fee
        console.log('\nTrying with small fee...');
        account.deployAccount({
            classHash: '0x033434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2', // OZ 0.6.1
            constructorCalldata: constructorCallData,
            addressSalt: publicKey
        }, {
            maxFee: BigInt(1000000000000000) // 0.001 ETH
        }).then(deployResponse => {
            console.log(`Transaction hash: ${deployResponse.transaction_hash}`);
            console.log('Deployment successful');
            console.log(`Account deployed: ${deployResponse.contract_address}`);
            console.log(`View on StarkScan: https://sepolia.starkscan.co/tx/${deployResponse.transaction_hash}`);
        }).catch(retryError => {
            console.error('Retry failed:', retryError.message);
            console.log('\n❌ Account deployment failed with both zero and small fees.');
            console.log('Please check:');
            console.log('1. Your RPC endpoint is valid and accessible');
            console.log('2. Your account has sufficient funds');
            console.log('3. See RPC_PROVIDER_FINDINGS.md for troubleshooting tips');
        });
    });
} else {
    console.log('⚠️  .env.testnet file not found');
    console.log('Please create .env.testnet with your StarkNet Sepolia configuration');
}