#!/usr/bin/env node

const { RpcProvider, Account, CallData } = require('starknet');

// Account details
const ACCOUNT_ADDRESS = '0x6c165005c23a89977a90eaaad7362b4ce7378d314fa5474a102d92d5c80d500';
const PRIVATE_KEY = '0x044b16e0371d0f1e02f710335b4c304f033e9c4bfdc3943c2e6f4fdf5d720a26a';
const PUBLIC_KEY = '0x2e9b020158b09c5e18d180270b4eef16f63ce30285f3d29e731d03a5bbfb91a';

// OpenZeppelin 0.6.1 account class hash
const OZ_ACCOUNT_CLASS_HASH = '0x033434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2';

// RPC endpoint
const RPC_ENDPOINT = 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/21xJKr6s7H7ynN5UxElPx';

async function deployAccount() {
    console.log('Deploying OZ 0.6.1 StarkNet Account');
    console.log('==============================');
    
    try {
        // Initialize provider
        const provider = new RpcProvider({
            nodeUrl: RPC_ENDPOINT
        });
        
        // Check connection
        const chainId = await provider.getChainId();
        console.log(`Connected to StarkNet (Chain ID: ${chainId})`);
        
        // Create account instance (v8 syntax)
        const account = new Account(provider, ACCOUNT_ADDRESS, PRIVATE_KEY);
        console.log(`Account loaded: ${ACCOUNT_ADDRESS}`);
        
        // Prepare constructor calldata for OZ 0.6.1
        const constructorCallData = CallData.compile([PUBLIC_KEY]);
        console.log('Constructor calldata prepared');
        
        // Deploy account with minimal fee
        console.log('Sending deployment transaction...');
        
        const deployResponse = await account.deployAccount({
            classHash: OZ_ACCOUNT_CLASS_HASH,
            constructorCalldata: constructorCallData,
            addressSalt: PUBLIC_KEY
        }, {
            maxFee: BigInt(500000000000000) // 0.0005 ETH
        });
        
        console.log(`Transaction hash: ${deployResponse.transaction_hash}`);
        console.log('Deployment successful');
        console.log(`Account deployed: ${deployResponse.contract_address}`);
        console.log(`View on StarkScan: https://sepolia.starkscan.co/tx/${deployResponse.transaction_hash}`);
        
    } catch (error) {
        console.error('Deployment failed:', error.message);
        console.error('Error details:', error);
    }
}

// Run deployment
deployAccount();