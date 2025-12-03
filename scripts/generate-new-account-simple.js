#!/usr/bin/env node

const { ec, hash, CallData } = require('starknet');

console.log('Generating New StarkNet Account');
console.log('==========================');

// Use the available OpenZeppelin 0.6.1 account class hash
const OZ_ACCOUNT_CLASS_HASH = '0x033434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2';

// Generate a new private key
console.log('\nGenerating new account keys...');
const privateKey = ec.starkCurve.utils.randomPrivateKey();
const privateKeyHex = '0x' + privateKey.toString(16);

// Get the public key from the private key
const publicKey = ec.starkCurve.getStarkKey(privateKey);

// Calculate the account address using the available class hash
const accountAddress = hash.calculateContractAddressFromHash(
    publicKey,
    OZ_ACCOUNT_CLASS_HASH,
    [publicKey],
    0 // salt
);

// Prepare constructor calldata
const constructorCallData = CallData.compile({ publicKey });

console.log('✅ New account generated successfully!');
console.log('\nAccount Details:');
console.log('===============');
console.log('1. Account Address:', accountAddress);
console.log('2. Private Key:', privateKeyHex);
console.log('3. Public Key:', publicKey);
console.log('4. Constructor Calldata:', JSON.stringify(constructorCallData));

console.log('\nNext Steps:');
console.log('1. Send testnet ETH to this address using StarkGate');
console.log('2. Once funded, you can deploy the account contract');
console.log('3. Use this account for your project');

// Save to a file for easy access
const fs = require('fs');
const path = require('path');

const accountInfo = {
    accountAddress: accountAddress,
    privateKey: privateKeyHex,
    publicKey: publicKey,
    constructorCallData: constructorCallData,
    classHash: OZ_ACCOUNT_CLASS_HASH
};

const filePath = path.join(__dirname, '..', 'NEW_ACCOUNT_DETAILS.json');
fs.writeFileSync(filePath, JSON.stringify(accountInfo, null, 2));
console.log(`\nAccount details saved to: ${filePath}`);