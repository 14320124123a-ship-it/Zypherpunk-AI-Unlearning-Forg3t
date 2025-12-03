#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('Building Cairo Contract...');
console.log('========================');

// Change to the cairo-contracts directory
const cairoDir = path.join(__dirname, '..', 'cairo-contracts');

// Execute scarb build
exec(`cd "${cairoDir}" && scarb build`, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error building contract: ${error.message}`);
        return;
    }
    
    if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
    }
    
    console.log('Contract built successfully!');
    console.log(stdout);
    
    console.log('\nContract artifacts are located in the target directory.');
    console.log('You can now deploy the contract using Starknet Foundry.');
});