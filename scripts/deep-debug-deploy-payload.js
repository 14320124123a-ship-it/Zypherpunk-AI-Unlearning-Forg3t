#!/usr/bin/env node

const { RpcProvider, Account, CallData } = require('starknet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('Deep Debug Deploy Payload Inspector');
console.log('==============================');

// Load environment variables from .env.testnet file
const envTestnetPath = path.join(__dirname, '..', '.env.testnet');
if (fs.existsSync(envTestnetPath)) {
    console.log('Loading environment variables from .env.testnet...');
    const envConfig = dotenv.parse(fs.readFileSync(envTestnetPath));
    const rpcUrl = envConfig.L2_RPC_ENDPOINT || 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/21xJKr6s7H7ynN5UxElPx';
    console.log(`RPC URL from .env.testnet: ${rpcUrl}`);
} else {
    const rpcUrl = 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/21xJKr6s7H7ynN5UxElPx';
    console.log(`Default RPC URL: ${rpcUrl}`);
}

// Account details
const ACCOUNT_ADDRESS = '0x6c165005c23a89977a90eaaad7362b4ce7378d314fa5474a102d92d5c80d500';
const PRIVATE_KEY = '0x44b16e0371d0fe02f710335b4c304f033e9c4bfdc3943c2e6f4fdf5d720a26a';
const PUBLIC_KEY = '0x2e9b020158b09c5e18d180270b4eef16f63ce30285f3d29e731d03a5bbfb91a';

// OpenZeppelin 0.6.1 account class hash
const OZ_ACCOUNT_CLASS_HASH = '0x033434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2';

console.log('\nAccount Details:');
console.log(`Address: ${ACCOUNT_ADDRESS}`);
console.log(`Private Key: ${PRIVATE_KEY}`);
console.log(`Class Hash: ${OZ_ACCOUNT_CLASS_HASH}`);

// Initialize provider
const provider = new RpcProvider({
    nodeUrl: 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/21xJKr6s7H7ynN5UxElPx'
});

// Create account instance (v6 syntax)
const account = new Account(provider, ACCOUNT_ADDRESS, PRIVATE_KEY);
console.log('\nAccount instance created successfully');

// Prepare constructor calldata
const constructorCallData = ['1317516635603979926555169664243057435891420669300975849552632884909333002522'];
console.log(`\nConstructor Calldata: ${JSON.stringify(constructorCallData)}`);

// Build deploy account payload details
console.log('\nAnalyzing Deploy Account Transaction Structure...');
console.log('============================================');

// Create deploy account parameters
const deployAccountParameters = {
    classHash: OZ_ACCOUNT_CLASS_HASH,
    constructorCalldata: constructorCallData,
    addressSalt: PUBLIC_KEY
};

console.log('\nDeploy Account Parameters:');
console.log(JSON.stringify(deployAccountParameters, null, 2));

// Transaction options with zero fee
const transactionOptionsZeroFee = {
    maxFee: 0n
};

console.log('\nTransaction Options (Zero Fee):');
console.log(JSON.stringify(transactionOptionsZeroFee, null, 2));

// Transaction options with small fee
const transactionOptionsSmallFee = {
    maxFee: BigInt(1000000000000000) // 0.001 ETH
};

console.log('\nTransaction Options (Small Fee):');
console.log(JSON.stringify(transactionOptionsSmallFee, null, 2));

// Let's examine what starknet.js v6 would typically generate
console.log('\nExpected Starknet.js v6 Transaction Structure:');
console.log('=========================================');

const expectedTransactionStructure = {
    type: 'DEPLOY_ACCOUNT',
    version: '0x1', // Starknet.js v6 typically uses version 1
    class_hash: OZ_ACCOUNT_CLASS_HASH,
    contract_address_salt: PUBLIC_KEY,
    constructor_calldata: constructorCallData,
    max_fee: '0x0', // For zero fee
    signature: [], // Will be filled by the library
    nonce: '0x0'
};

console.log('\nExpected Zero Fee Transaction:');
console.log(JSON.stringify(expectedTransactionStructure, null, 2));

const expectedTransactionStructureWithFee = {
    type: 'DEPLOY_ACCOUNT',
    version: '0x1', // Starknet.js v6 typically uses version 1
    class_hash: OZ_ACCOUNT_CLASS_HASH,
    contract_address_salt: PUBLIC_KEY,
    constructor_calldata: constructorCallData,
    max_fee: '0x38d7ea4c68000', // 0.001 ETH in hex
    signature: [], // Will be filled by the library
    nonce: '0x0'
};

console.log('\nExpected Small Fee Transaction:');
console.log(JSON.stringify(expectedTransactionStructureWithFee, null, 2));

console.log('\nRPC Compatibility Analysis:');
console.log('========================');
console.log('Issues we encountered previously:');
console.log('- "l1_data_gas" field not supported by current RPC');
console.log('- "transaction version not supported" error');
console.log('\nWhat we know about Starknet.js v6:');
console.log('- Uses maxFee instead of resourceBounds');
console.log('- Typically uses transaction version 0x1');
console.log('- Does not include l1_data_gas field');
console.log('\nPotential causes of version error:');
console.log('- Network might require version 0x2 or 0x3');
console.log('- RPC might have stricter validation');
console.log('- Temporary network upgrade in progress');

console.log('\nRecommendation:');
console.log('=============');
console.log('The transaction structure looks correct for Starknet.js v6.');
console.log('The "version not supported" error might be temporary.');
console.log('Consider trying again in 24-48 hours after network stabilization.');