#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Deploying Cairo Contract to Starknet...');
console.log('====================================');

// Check if Starknet Foundry is installed
exec('sncast --version', (error, stdout, stderr) => {
    if (error) {
        console.error('Starknet Foundry (sncast) is not installed or not in PATH.');
        console.log('Please install Starknet Foundry following the instructions in NOIR_ZTARKNET_DEPLOYMENT_GUIDE.md');
        return;
    }
    
    console.log(`Found sncast: ${stdout}`);
    
    // Change to the cairo-contracts directory
    const cairoDir = path.join(__dirname, '..', 'cairo-contracts');
    
    // Check if target directory exists
    const targetDir = path.join(cairoDir, 'target');
    if (!fs.existsSync(targetDir)) {
        console.error('Contract has not been built yet. Please run build-cairo-contract.js first.');
        return;
    }
    
    // Deploy the contract (this is a placeholder - actual deployment would require account setup)
    console.log('\nTo deploy the contract, you would run:');
    console.log('1. Create and fund an account:');
    console.log('   sncast account create --url https://rpc.sepolia.starknet.io');
    console.log('   # Fund the account from the Starknet Sepolia faucet');
    console.log('   sncast account deploy --url https://rpc.sepolia.starknet.io');
    console.log('');
    console.log('2. Declare the contract:');
    console.log('   sncast declare --contract-name ProofRegistry --url https://rpc.sepolia.starknet.io');
    console.log('');
    console.log('3. Deploy the contract:');
    console.log('   sncast deploy --class-hash <CLASS_HASH> --url https://rpc.sepolia.starknet.io');
    console.log('');
    console.log('Note: Replace <CLASS_HASH> with the actual class hash from the declare step.');
});