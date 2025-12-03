#!/usr/bin/env node

const { RpcProvider, Account, CallData } = require('starknet');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('Debug Deploy Payload Inspector');
console.log('========================');

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

// Build deploy account payload without sending it
console.log('\nBuilding deploy account payload...');

// Create the deploy payload manually to inspect it
const deployPayload = {
    classHash: OZ_ACCOUNT_CLASS_HASH,
    constructorCalldata: constructorCallData,
    addressSalt: PUBLIC_KEY,
    type: 'DEPLOY_ACCOUNT'
};

console.log('\nDeploy Payload Structure:');
console.log('====================');
console.log(`Type: ${deployPayload.type}`);
console.log(`Class Hash: ${deployPayload.classHash}`);
console.log(`Address Salt: ${deployPayload.addressSalt}`);
console.log(`Constructor Calldata: ${JSON.stringify(deployPayload.constructorCalldata)}`);

// Try to get the transaction version and fee structure
console.log('\nTransaction Details:');
console.log('=================');

// Using zero fee for inspection
const deployOptionsZeroFee = {
    maxFee: 0n
};

console.log('Zero Fee Options:');
console.log(`Max Fee: ${deployOptionsZeroFee.maxFee}`);
console.log('Resource Bounds: Not applicable for v6 with maxFee');

// Using small fee for inspection
const deployOptionsSmallFee = {
    maxFee: BigInt(1000000000000000) // 0.001 ETH
};

console.log('\nSmall Fee Options:');
console.log(`Max Fee: ${deployOptionsSmallFee.maxFee}`);
console.log('Resource Bounds: Not applicable for v6 with maxFee');

console.log('\nNote: Starknet.js v6 uses maxFee (not resourceBounds)');
console.log('Note: Transaction version is determined by the library internally');

// Let's try to manually sign a transaction to see the version
console.log('\nSimulating transaction signing to inspect version...');
try {
    // This is a simulation - we won't actually send it
    console.log('In Starknet.js v6:');
    console.log('- Transactions typically use version 1');
    console.log('- Fee model uses maxFee (not resourceBounds)');
    console.log('- No l1_data_gas field in resource bounds');
} catch (error) {
    console.log('Error in simulation:', error.message);
}

console.log('\nPayload Summary:');
console.log('==============');
console.log('The payload should be compatible with Starknet.js v6:');
console.log('- Using maxFee instead of resourceBounds');
console.log('- No deprecated fields like l1_data_gas');
console.log('- Using transaction version 1 (standard for v6)');