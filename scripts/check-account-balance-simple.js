#!/usr/bin/env node

const { RpcProvider } = require('starknet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('Checking StarkNet Account Balance (Simple Version)');
console.log('============================================');

// Load environment variables from .env.testnet file
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

async function checkBalance() {
    try {
        // Use Alchemy RPC endpoint
        const provider = new RpcProvider({
            nodeUrl: 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/21xJKr6s7H7ynN5UxElPx'
        });
        
        const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;
        
        console.log('\nChecking connection...');
        const chainId = await provider.getChainId();
        console.log(`Connected to StarkNet (Chain ID: ${chainId})`);
        
        console.log(`\nChecking balance for: ${accountAddress}`);
        
        // Get ETH token contract address
        const ethTokenAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
        
        console.log('Calling balanceOf function...');
        const result = await provider.callContract({
            contractAddress: ethTokenAddress,
            entrypoint: 'balanceOf',
            calldata: [accountAddress]
        });
        
        console.log('Raw result:', result);
        
        if (result && result.length > 0) {
            // The balance is returned as a felt (field element)
            // Convert it to a BigInt for easier handling
            const balanceLow = BigInt(result[0]);
            let balanceHigh = 0n;
            
            if (result.length > 1) {
                balanceHigh = BigInt(result[1]);
            }
            
            // Combine low and high parts for full balance
            const balance = balanceLow + (balanceHigh << 128n);
            const balanceEth = Number(balance) / 1e18;
            
            console.log(`\n💰 Account Balance:`);
            console.log(`   Wei: ${balance.toString()}`);
            console.log(`   ETH: ${balanceEth.toFixed(6)} ETH`);
            
            if (balanceEth > 0) {
                console.log('✅ Account has ETH balance');
            } else {
                console.log('⚠️  Account has zero balance');
            }
        } else {
            console.log('❌ No balance data returned');
        }
        
        // Check if account is deployed by trying to get nonce
        console.log('\nChecking if account is deployed...');
        try {
            const nonce = await provider.getNonceForAddress(accountAddress);
            console.log(`✅ Account is deployed (nonce: ${nonce})`);
        } catch (error) {
            console.log('❌ Account is not deployed yet');
            console.log('   You need to send a transaction to deploy it');
        }
        
        console.log(`\n📊 View on StarkScan: https://sepolia.starkscan.co/contract/${accountAddress}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Error details:', error);
    }
}

checkBalance();