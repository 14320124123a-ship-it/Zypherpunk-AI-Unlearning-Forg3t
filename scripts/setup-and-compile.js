#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📦 Setting up Scarb and Compiling Cairo Contracts');
console.log('==============================================');

// Function to execute commands and show output
function runCommand(command, description) {
    console.log(`\n🔧 ${description}`);
    console.log(`   Executing: ${command}`);
    
    try {
        const output = execSync(command, { 
            encoding: 'utf8', 
            stdio: 'inherit',
            cwd: path.join(__dirname, '..', 'cairo-contracts')
        });
        return true;
    } catch (error) {
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

// Check if Scarb is installed
console.log('🔍 Checking if Scarb is installed...');
let scarbCommand = 'scarb';
try {
    const versionOutput = execSync('scarb --version', { encoding: 'utf8' });
    console.log(`✅ Scarb is installed: ${versionOutput.trim()}`);
} catch (error) {
    // Try local Scarb installation
    const localScarbPath = path.join(__dirname, '..', '..', 'scarb-v2.14.0-x86_64-pc-windows-msvc', 'bin', 'scarb.exe');
    if (fs.existsSync(localScarbPath)) {
        console.log(`✅ Found local Scarb installation: ${localScarbPath}`);
        scarbCommand = localScarbPath;
    } else {
        console.log('❌ Scarb is not installed and local version not found.');
        console.log('\n📝 Please install Scarb first:');
        console.log('   Visit: https://docs.swmansion.com/scarb/');
        console.log('   Or run: curl --proto \'=https\' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh');
        process.exit(1);
    }
}

// Navigate to cairo-contracts directory and build
console.log('\n🏗️  Building Cairo contract...');
try {
    // Change to cairo-contracts directory
    const cairoDir = path.join(__dirname, '..', 'cairo-contracts');
    
    // Run scarb build
    console.log(`   Running: ${scarbCommand} build`);
    execSync(`"${scarbCommand}" build`, { 
        cwd: cairoDir,
        stdio: 'inherit'
    });
    
    console.log('✅ Contract compiled successfully!');
    
    // Check if artifacts were created
    const targetDir = path.join(cairoDir, 'target', 'dev');
    if (fs.existsSync(targetDir)) {
        console.log('\n📂 Generated artifacts:');
        const files = fs.readdirSync(targetDir);
        files.forEach(file => {
            if (file.endsWith('.json')) {
                console.log(`   - ${file}`);
            }
        });
    }
    
    console.log('\n🎉 Compilation completed successfully!');
    console.log('You can now deploy the contract to StarkNet Sepolia testnet.');
    
} catch (error) {
    console.log('❌ Contract compilation failed:');
    console.log(error.message);
    process.exit(1);
}