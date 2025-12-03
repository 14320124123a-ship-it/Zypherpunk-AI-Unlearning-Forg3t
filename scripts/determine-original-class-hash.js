#!/usr/bin/env node

const { ec, hash, CallData } = require('starknet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('Determining Original Account Class Hash');
console.log('=================================');

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
    accountAddress: process.env.STARKNET_ACCOUNT_ADDRESS,
    privateKey: process.env.STARKNET_PRIVATE_KEY
};

// List of known account class hashes
const knownClassHashes = [
    {
        name: 'OZ Account v0.5.1',
        hash: '0x0490400477682342b77245100265dc5a4943df1bc6f4bd9508009e9f7c0500a0'
    },
    {
        name: 'OZ Account v0.6.1',
        hash: '0x033434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2'
    },
    {
        name: 'OZ Account v0.7.0',
        hash: '0x02791fcafba156d4649755801a318253301c64a1a99508c6e8b042342d8145a2'
    },
    {
        name: 'OZ Account v0.8.0',
        hash: '0x048dd59fabc729a5db3afdf649ecaf388e931647ab2f53ca3c6183fa480aa292'
    },
    {
        name: 'Argent Account v0.2.0',
        hash: '0x0299e9e7daf64cce4be04db459c5341fdb399d37297f80f802163bf0db0c987c'
    },
    {
        name: 'Braavos Account v1',
        hash: '0x03131fa018d520a037686ce3efddeab8f28895662f019ca3ca18a626650f7d1e'
    }
];

async function determineOriginalClassHash() {
    try {
        // Derive public key from private key
        console.log('Deriving public key from private key...');
        const publicKey = ec.starkCurve.getStarkKey(config.privateKey);
        console.log(`Public key: ${publicKey}`);

        console.log(`\nExpected account address: ${config.accountAddress}`);
        console.log('\nTesting which class hash was used to generate this address...\n');
        
        let matchingClassHash = null;
        
        for (const { name, hash } of knownClassHashes) {
            // Prepare constructor calldata
            const constructorCallData = CallData.compile({ publicKey });
            
            // Calculate address
            const calculatedAddress = hash.calculateContractAddressFromHash(
                publicKey,
                hash,
                constructorCallData,
                0 // salt
            );
            
            console.log(`${name}: ${hash}`);
            console.log(`  Calculated address: ${calculatedAddress}`);
            
            if (calculatedAddress.toLowerCase() === config.accountAddress.toLowerCase()) {
                console.log(`  ✅ MATCH! This is the class hash used to generate your account.`);
                matchingClassHash = { name, hash };
                break;
            } else {
                console.log(`  ❌ No match`);
            }
            console.log('');
        }
        
        if (matchingClassHash) {
            console.log('🎉 Found the original class hash!');
            console.log(`   Name: ${matchingClassHash.name}`);
            console.log(`   Hash: ${matchingClassHash.hash}`);
            console.log('\nHowever, this class hash may not be available on the current network.');
            console.log('You have a few options:');
            console.log('1. Wait for the network to restore the original class hash');
            console.log('2. Generate a new account with an available class hash');
            console.log('3. Check if there\'s a migration path for existing accounts');
        } else {
            console.log('❌ Could not determine which class hash was used to generate your account.');
            console.log('This might indicate an issue with the account generation process.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

determineOriginalClassHash();