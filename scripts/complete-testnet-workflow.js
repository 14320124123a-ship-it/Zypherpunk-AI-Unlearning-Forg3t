#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 StarkNet Sepolia Testnet Complete Workflow');
console.log('==========================================');

// Function to execute commands and show output
function runCommand(command, description) {
    console.log(`\n🔧 ${description}`);
    console.log(`   Command: ${command}`);
    
    try {
        const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
        console.log(`   Output: ${output.trim()}`);
        return true;
    } catch (error) {
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

// Check if we're on Windows or Unix-like system
const isWindows = process.platform === 'win32';

console.log('\n📋 Workflow Steps:');
console.log('=================');

console.log('\n1. Generate Testnet Account');
if (isWindows) {
    console.log('   Run: node scripts\\generate-testnet-account.js');
} else {
    console.log('   Run: node scripts/generate-testnet-account.js');
}

console.log('\n2. Fund Your Account');
console.log('   Visit: https://sepolia.starkgate.starknet.io/');
console.log('   Bridge ETH from Ethereum Sepolia to your StarkNet account');

console.log('\n3. Install Scarb');
console.log('   Visit: https://docs.swmansion.com/scarb/');

console.log('\n4. Compile Cairo Contract');
if (isWindows) {
    console.log('   Run: .\\scripts\\setup-and-compile.bat');
} else {
    console.log('   Run: ./scripts/setup-and-compile.sh');
}

console.log('\n5. Deploy Contract to Testnet');
console.log('   Run: node scripts/deploy-contract-testnet.js');

console.log('\n6. Configure Backend Service');
if (isWindows) {
    console.log('   Run: copy .env.testnet backend-service\\.env');
} else {
    console.log('   Run: cp .env.testnet backend-service/.env');
}

console.log('\n7. Start Backend Services');
if (isWindows) {
    console.log('   Run: .\\scripts\\start-backend.bat');
} else {
    console.log('   Run: ./scripts/start-backend.sh');
}

console.log('\n8. Start Frontend');
console.log('   Run: npm run dev');

console.log('\n🎯 Ready to Go!');
console.log('===============');
console.log('Follow these steps in order to deploy your contract to StarkNet Sepolia testnet.');
console.log('Each step builds on the previous one, so make sure to complete them sequentially.');

console.log('\n⚠️  Important Notes:');
console.log('==================');
console.log('1. You must fund your account before deployment (step 2)');
console.log('2. Scarb must be installed before compilation (step 3)');
console.log('3. The Cairo contract must be compiled before deployment (step 4)');
console.log('4. Environment variables must be set for the deployment script to work');

console.log('\n💡 Tips:');
console.log('=======');
console.log('- Check the .env.testnet file for your account details');
console.log('- Verify your account has ETH balance before deployment');
console.log('- Keep your private key secure and never share it');
console.log('- Use a block explorer to verify transactions: https://sepolia.starkscan.co/');