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
    console.log('Deploying StarkNet Account (Compatible Mode)');
    console.log('====================================');
    
    try {
        // Initialize provider
        const provider = new RpcProvider({
            nodeUrl: RPC_ENDPOINT
        });
        
        // Check connection
        const chainId = await provider.getChainId();
        console.log(`Connected to StarkNet (Chain ID: ${chainId})`);
        
        // Create account instance
        const account = new Account(provider, ACCOUNT_ADDRESS, PRIVATE_KEY);
        console.log(`Account loaded: ${ACCOUNT_ADDRESS}`);
        
        // Prepare constructor calldata for OZ 0.6.1
        const constructorCallData = CallData.compile({
            publicKey: PUBLIC_KEY
        });
        console.log('Constructor calldata prepared');
        
        // Deploy account with zero fee (common on testnets)
        console.log('Sending deployment transaction with zero fee...');
        
        const deployResponse = await account.deployAccount({
            classHash: OZ_ACCOUNT_CLASS_HASH,
            constructorCalldata: constructorCallData,
            addressSalt: PUBLIC_KEY
        }, {
            maxFee: 0n // Zero fee - often works on testnets
        });
        
        console.log(`Transaction hash: ${deployResponse.transaction_hash}`);
        
        // Wait for transaction confirmation
        console.log('Waiting for confirmation...');
        const receipt = await provider.waitForTransaction(deployResponse.transaction_hash);
        
        if (receipt.status === 'ACCEPTED_ON_L2' || receipt.status === 'ACCEPTED_ON_L1') {
            console.log('Deployment successful');
            console.log(`Account deployed: ${deployResponse.contract_address}`);
            console.log(`View on StarkScan: https://sepolia.starkscan.co/tx/${deployResponse.transaction_hash}`);
        } else {
            console.log(`Deployment completed with status: ${receipt.status}`);
        }
        
    } catch (error) {
        console.error('Deployment failed:', error.message);
        console.error('Error stack:', error.stack);
        
        // If zero fee fails, try with small fee
        if (error.message.includes('maxFee')) {
            console.log('\nTrying with small fee...');
            try {
                const provider = new RpcProvider({
                    nodeUrl: RPC_ENDPOINT
                });
                
                const account = new Account(provider, ACCOUNT_ADDRESS, PRIVATE_KEY);
                
                const constructorCallData = CallData.compile({
                    publicKey: PUBLIC_KEY
                });
                
                const deployResponse = await account.deployAccount({
                    classHash: OZ_ACCOUNT_CLASS_HASH,
                    constructorCalldata: constructorCallData,
                    addressSalt: PUBLIC_KEY
                }, {
                    maxFee: BigInt(1000000000000000) // 0.001 ETH
                });
                
                console.log(`Transaction hash: ${deployResponse.transaction_hash}`);
                
                const receipt = await provider.waitForTransaction(deployResponse.transaction_hash);
                
                if (receipt.status === 'ACCEPTED_ON_L2' || receipt.status === 'ACCEPTED_ON_L1') {
                    console.log('Deployment successful');
                    console.log(`Account deployed: ${deployResponse.contract_address}`);
                    console.log(`View on StarkScan: https://sepolia.starkscan.co/tx/${deployResponse.transaction_hash}`);
                } else {
                    console.log(`Deployment completed with status: ${receipt.status}`);
                }
            } catch (retryError) {
                console.error('Retry failed:', retryError.message);
            }
        }
    }
}

// Run deployment
deployAccount();