#!/usr/bin/env node

const { RpcProvider } = require('starknet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('Checking StarkNet Account Balance');
console.log('==============================');

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
} else {
    console.log('⚠️  .env.testnet file not found');
    process.exit(1);
}

// List of RPC providers to try
const rpcProviders = [
    'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/21xJKr6s7H7ynN5UxElPx',
    'https://starknet-sepolia.drpc.org',
    'https://free-rpc.nethermind.io/sepolia-juno/'
];

async function checkBalance() {
    let provider;
    let workingRpcUrl = null;

    // Try to find a working RPC provider
    console.log('\n🔍 Testing RPC providers...');
    for (const rpcUrl of rpcProviders) {
        console.log(`   Testing: ${rpcUrl}`);
        try {
            const testProvider = new RpcProvider({ nodeUrl: rpcUrl });
            const chainId = await testProvider.getChainId();
            console.log(`   ✅ Connected to ${rpcUrl} (Chain ID: ${chainId})`);
            provider = testProvider;
            workingRpcUrl = rpcUrl;
            break;
        } catch (error) {
            console.log(`   ❌ Failed to connect to ${rpcUrl}: ${error.message}`);
        }
    }

    if (!provider) {
        console.log('❌ No working RPC provider found');
        process.exit(1);
    }

    console.log(`\n🔧 Using RPC provider: ${workingRpcUrl}`);

    const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;

    try {
        console.log(`\n💰 Checking balance for account: ${accountAddress}`);
        
        // Get the ETH token contract address on StarkNet Sepolia
        const ethTokenAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
        
        // Try different block identifiers
        const blockIds = ['latest', 'pending'];
        let balanceResult = null;
        
        for (const blockId of blockIds) {
            try {
                console.log(`   Trying block_id: ${blockId}`);
                balanceResult = await provider.callContract({
                    contractAddress: ethTokenAddress,
                    entrypoint: 'balanceOf',
                    calldata: [accountAddress],
                    blockIdentifier: blockId
                });
                console.log(`   Success with block_id: ${blockId}`);
                break;
            } catch (error) {
                console.log(`   Failed with block_id ${blockId}: ${error.message}`);
            }
        }
        
        if (!balanceResult) {
            // Try without block identifier
            console.log(`   Trying without block identifier`);
            balanceResult = await provider.callContract({
                contractAddress: ethTokenAddress,
                entrypoint: 'balanceOf',
                calldata: [accountAddress]
            });
        }
        
        // The result is an array, we need the first element
        const balance = BigInt(balanceResult[0]);
        const balanceEth = Number(balance) / 1e18;
        
        console.log(`   Balance: ${balance.toString()} wei (${balanceEth.toFixed(6)} ETH)`);
        
        if (balanceEth > 0) {
            console.log('✅ Account has sufficient balance for deployment');
        } else {
            console.log('⚠️  Account has zero balance. Please bridge ETH from Ethereum Sepolia using StarkGate');
            console.log('   Visit: https://sepolia.starkgate.starknet.io/');
        }

        // Also check if account is deployed by trying to get nonce
        console.log('\n🔎 Checking if account is deployed...');
        try {
            const nonce = await provider.getNonceForAddress(accountAddress);
            console.log(`   Account nonce: ${nonce}`);
            console.log('   ✅ Account is deployed');
        } catch (error) {
            console.log('   ❌ Account is not deployed yet');
            console.log('   You need to send a transaction from this account to deploy it');
        }

    } catch (error) {
        console.error('❌ Failed to check balance:', error.message);
        
        // Try alternative method using getBalance if available
        try {
            if (provider.getBalance) {
                const balance = await provider.getBalance(accountAddress);
                const balanceEth = Number(balance) / 1e18;
                console.log(`   Balance (alternative method): ${balance.toString()} wei (${balanceEth.toFixed(6)} ETH)`);
            }
        } catch (altError) {
            console.log('   Alternative balance check also failed:', altError.message);
        }
    }
    
    console.log(`\n📊 View your account on StarkScan: https://sepolia.starkscan.co/contract/${accountAddress}`);
}

// Run the balance check
checkBalance();