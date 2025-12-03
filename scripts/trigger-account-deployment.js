#!/usr/bin/env node

const { RpcProvider, Account, ec, hash, CallData, uint256 } = require('starknet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('Triggering Account Deployment via ETH Transfer');
console.log('==========================================');

// Load environment variables
const envTestnetPath = path.join(__dirname, '..', '.env.testnet');
if (fs.existsSync(envTestnetPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envTestnetPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
    console.log(`Using account: ${process.env.STARKNET_ACCOUNT_ADDRESS}`);
} else {
    console.log('⚠️  .env.testnet file not found');
    process.exit(1);
}

// Configuration
const config = {
    rpcUrl: 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/21xJKr6s7H7ynN5UxElPx',
    accountAddress: process.env.STARKNET_ACCOUNT_ADDRESS,
    privateKey: process.env.STARKNET_PRIVATE_KEY
};

async function triggerDeployment() {
    try {
        console.log('\nInitializing provider with Alchemy RPC...');
        const provider = new RpcProvider({ nodeUrl: config.rpcUrl });
        
        // Check connection
        const chainId = await provider.getChainId();
        console.log(`Connected to network (Chain ID: ${chainId})`);

        // Create account instance
        const account = new Account(provider, config.accountAddress, config.privateKey);
        
        console.log('\nPreparing ETH transfer to self (will trigger account deployment)...');
        
        // Prepare a small ETH transfer to self (0.0001 ETH)
        const amountWei = uint256.bnToUint256(BigInt(100000000000000)); // 0.0001 ETH in wei
        
        // ETH contract address on StarkNet
        const ethContractAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
        
        // Prepare the transaction
        const transferCall = {
            contractAddress: ethContractAddress,
            entrypoint: 'transfer',
            calldata: CallData.compile({
                recipient: config.accountAddress, // Send to self
                amount: amountWei
            })
        };
        
        console.log('Sending ETH transfer transaction...');
        
        // Execute the transaction
        const { transaction_hash } = await account.execute(
            transferCall,
            undefined, // No specific contract to contract calls
            {
                maxFee: BigInt(1000000000000000) // 0.001 ETH max fee
            }
        );
        
        console.log(`✅ Transaction submitted: ${transaction_hash}`);
        console.log('This should trigger account deployment if it is not already deployed.');
        console.log('Waiting for confirmation...');
        
        // Wait for transaction to be confirmed
        const receipt = await provider.waitForTransaction(transaction_hash);
        console.log(`Transaction status: ${receipt.status}`);
        
        if (receipt.status === 'ACCEPTED_ON_L2' || receipt.status === 'ACCEPTED_ON_L1') {
            console.log('🎉 Transaction successful! Account should now be deployed.');
            console.log(`Transaction: https://sepolia.starkscan.co/tx/${transaction_hash}`);
        } else {
            console.log(`⚠️  Transaction completed with status: ${receipt.status}`);
        }

    } catch (error) {
        console.error('❌ Transaction failed:', error.message);
        console.error('Error details:', error);
        
        if (error.message.includes('Contract not found')) {
            console.log('\nThis error indicates your account is not deployed yet.');
            console.log('The transaction failed because the account contract does not exist on-chain.');
            console.log('This is expected if the account has never sent a transaction before.');
        }
    }
}

triggerDeployment();