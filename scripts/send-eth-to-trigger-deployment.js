#!/usr/bin/env node

const { RpcProvider, Account, ec, hash, CallData, uint256 } = require('starknet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('Sending ETH to Trigger Account Deployment');
console.log('====================================');

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

// Target address to send ETH to (to trigger deployment)
const targetAddress = '0x01176a1bd84444c89232ec27754698e5d2e7e1a7f1539f12027f28b23ec9f3d8';

async function sendEth() {
    try {
        console.log('\nInitializing provider with Alchemy RPC...');
        const provider = new RpcProvider({ nodeUrl: config.rpcUrl });
        
        // Check connection
        const chainId = await provider.getChainId();
        console.log(`Connected to network (Chain ID: ${chainId})`);

        // Create account instance
        const account = new Account(provider, config.accountAddress, config.privateKey);
        
        console.log(`\nPreparing to send 0.000001 ETH to: ${targetAddress}`);
        
        // Prepare the amount (0.000001 ETH = 1,000,000,000,000 Wei)
        const amountWei = uint256.bnToUint256(BigInt(1000000000000)); // 0.000001 ETH in wei
        
        // ETH contract address on StarkNet
        const ethContractAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
        
        // Prepare the transaction
        const transferCall = {
            contractAddress: ethContractAddress,
            entrypoint: 'transfer',
            calldata: CallData.compile({
                recipient: targetAddress,
                amount: amountWei
            })
        };
        
        console.log('Transaction details:');
        console.log(`  From: ${config.accountAddress}`);
        console.log(`  To: ${targetAddress}`);
        console.log(`  Amount: 0.000001 ETH (${amountWei.low.toString()} wei)`);
        
        console.log('\nSending ETH transfer transaction...');
        
        // Execute the transaction
        const { transaction_hash } = await account.execute(
            transferCall,
            undefined, // No specific contract to contract calls
            {
                maxFee: BigInt(500000000000000) // 0.0005 ETH max fee
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
    
    console.log(`\n📊 View your account on StarkScan: https://sepolia.starkscan.co/contract/${config.accountAddress}`);
}

sendEth();