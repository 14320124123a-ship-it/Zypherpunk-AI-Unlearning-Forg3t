#!/usr/bin/env node

const { RpcProvider, Account } = require('starknet');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking StarkNet Account Balance');
console.log('===================================');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.testnet') });

// Configuration
const config = {
    rpcUrl: process.env.L2_RPC_ENDPOINT || 'https://starknet-sepolia.drpc.org',
    accountAddress: process.env.STARKNET_ACCOUNT_ADDRESS,
    privateKey: process.env.STARKNET_PRIVATE_KEY
};

console.log('\n📋 Configuration:');
console.log(`   RPC URL: ${config.rpcUrl}`);
console.log(`   Account Address: ${config.accountAddress}`);

if (!config.accountAddress || !config.privateKey) {
    console.log('\n❌ Missing account configuration');
    console.log('   Please run "npm run testnet:generate-account" first');
    process.exit(1);
}

async function checkAccount() {
    try {
        // Initialize provider and account
        const provider = new RpcProvider({
            nodeUrl: config.rpcUrl
        });

        const account = new Account(
            provider,
            config.accountAddress,
            config.privateKey
        );

        // Check chain ID
        console.log('\n🔗 Checking chain connection...');
        const chainId = await provider.getChainId();
        console.log(`   Chain ID: ${chainId}`);

        // Check account balance
        console.log('\n💰 Checking account balance...');
        try {
            // For newer versions of starknet.js, we need to use a different approach
            // Let's try to get the balance by calling the account contract directly
            const balance = await provider.callContract({
                contractAddress: config.accountAddress,
                entrypoint: 'get_balance'
            }).catch(() => {
                // If that fails, let's just check if the account exists by trying to get nonce
                return null;
            });
            
            if (balance) {
                const balanceEth = parseFloat(balance.toString()) / 1e18;
                console.log(`   Balance: ${balance.toString()} wei (${balanceEth.toFixed(6)} ETH)`);
                
                if (balance === 0n) {
                    console.log('\n⚠️  Account has zero balance.');
                    console.log('   Visit: https://sepolia.starkgate.starknet.io/ to bridge ETH');
                } else if (balanceEth < 0.01) {
                    console.log('\n⚠️  Account balance is low.');
                    console.log('   Consider adding more ETH for deployments and transactions');
                } else {
                    console.log('\n✅ Account has sufficient balance for testing');
                }
            } else {
                console.log('   Unable to fetch balance directly. The account may not exist on the network yet.');
                console.log('   Visit: https://sepolia.starkgate.starknet.io/ to bridge ETH to this account');
            }
        } catch (error) {
            console.log('⚠️  Could not fetch balance:', error.message);
            console.log('   The account may not exist on the network yet.');
            console.log('   Visit: https://sepolia.starkgate.starknet.io/ to bridge ETH to this account');
        }

        // Check account nonce
        console.log('\n🔢 Checking account nonce...');
        try {
            // Try different methods to get nonce
            let nonce;
            try {
                nonce = await account.getNonce();
            } catch (e) {
                // Fallback method
                try {
                    nonce = await provider.getNonceForAddress(config.accountAddress);
                } catch (e2) {
                    nonce = 'unknown';
                }
            }
            console.log(`   Nonce: ${nonce}`);
        } catch (error) {
            console.log('⚠️  Could not fetch nonce:', error.message);
        }

        console.log('\n🎉 Account check completed successfully!');

    } catch (error) {
        console.error('❌ Account check failed:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Run the check
checkAccount();