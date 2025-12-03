#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Testing Deployment Setup');
console.log('======================');

// Check if .env.testnet exists
const envTestnetPath = path.join(__dirname, '..', '.env.testnet');
console.log(`Checking for .env.testnet file at: ${envTestnetPath}`);

if (fs.existsSync(envTestnetPath)) {
    console.log('✅ .env.testnet file found');
    
    // Read the file to check its contents
    const envContent = fs.readFileSync(envTestnetPath, 'utf8');
    console.log('\n.env.testnet contents:');
    console.log('====================');
    console.log(envContent);
    
    // Check if it has the required variables
    const hasRpcEndpoint = envContent.includes('L2_RPC_ENDPOINT');
    const hasAccountAddress = envContent.includes('STARKNET_ACCOUNT_ADDRESS');
    const hasPrivateKey = envContent.includes('STARKNET_PRIVATE_KEY');
    
    console.log('\nValidation:');
    console.log('===========');
    console.log(`L2_RPC_ENDPOINT present: ${hasRpcEndpoint ? '✅' : '❌'}`);
    console.log(`STARKNET_ACCOUNT_ADDRESS present: ${hasAccountAddress ? '✅' : '❌'}`);
    console.log(`STARKNET_PRIVATE_KEY present: ${hasPrivateKey ? '✅' : '❌'}`);
    
    if (hasRpcEndpoint && hasAccountAddress && hasPrivateKey) {
        console.log('\n🎉 Environment file is properly configured!');
        console.log('You can now proceed with contract deployment.');
    } else {
        console.log('\n⚠️  Environment file is missing some required variables.');
        console.log('Please run generate-testnet-account.js first.');
    }
} else {
    console.log('❌ .env.testnet file not found');
    console.log('Please run generate-testnet-account.js first to create it.');
}

// Check if cairo-contracts directory exists
const cairoContractsPath = path.join(__dirname, '..', 'cairo-contracts');
console.log(`\nChecking for cairo-contracts directory at: ${cairoContractsPath}`);

if (fs.existsSync(cairoContractsPath)) {
    console.log('✅ cairo-contracts directory found');
    
    // Check if Scarb.toml exists
    const scarbTomlPath = path.join(cairoContractsPath, 'Scarb.toml');
    if (fs.existsSync(scarbTomlPath)) {
        console.log('✅ Scarb.toml found');
    } else {
        console.log('❌ Scarb.toml not found');
    }
    
    // Check if src directory exists
    const srcPath = path.join(cairoContractsPath, 'src');
    if (fs.existsSync(srcPath)) {
        console.log('✅ src directory found');
        
        // Check if lib.cairo exists
        const libCairoPath = path.join(srcPath, 'lib.cairo');
        if (fs.existsSync(libCairoPath)) {
            console.log('✅ lib.cairo found');
        } else {
            console.log('❌ lib.cairo not found');
        }
    } else {
        console.log('❌ src directory not found');
    }
} else {
    console.log('❌ cairo-contracts directory not found');
}

console.log('\nNext steps:');
console.log('===========');
console.log('1. Install Scarb (if not already installed)');
console.log('2. Compile the Cairo contract: cd cairo-contracts && scarb build');
console.log('3. Fund your StarkNet testnet account');
console.log('4. Run the deployment script: node scripts/deploy-contract-testnet.js');