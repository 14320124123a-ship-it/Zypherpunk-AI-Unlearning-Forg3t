#!/usr/bin/env node

const { exec } = require('child_process');

console.log('Checking Prerequisites for Noir & Ztarknet Integration');
console.log('====================================================');

const tools = [
  { name: 'Python', command: 'python --version', minVersion: '3.10' },
  { name: 'Node.js', command: 'node --version', minVersion: '16.0' },
  { name: 'npm', command: 'npm --version', minVersion: '7.0' },
  { name: 'Scarb', command: 'scarb --version', minVersion: '2.8' },
  { name: 'nargo', command: 'nargo --version', minVersion: '0.1' },
  { name: 'bb', command: 'bb --version', minVersion: '0.1' },
  { name: 'sncast', command: 'sncast --version', minVersion: '0.1' }
];

let allInstalled = true;

async function checkTool(tool) {
  return new Promise((resolve) => {
    exec(tool.command, (error, stdout, stderr) => {
      if (error) {
        console.log(`❌ ${tool.name}: Not installed`);
        console.log(`   Recommendation: ${getInstallationGuide(tool.name)}`);
        allInstalled = false;
        resolve(false);
      } else {
        const versionOutput = stdout || stderr;
        console.log(`✅ ${tool.name}: ${versionOutput.trim()}`);
        resolve(true);
      }
    });
  });
}

function getInstallationGuide(toolName) {
  const guides = {
    'Python': 'Install Python 3.10+ from python.org or use pyenv',
    'Node.js': 'Install Node.js from nodejs.org',
    'npm': 'Install Node.js (includes npm) from nodejs.org',
    'Scarb': 'Follow installation guide at docs.swmansion.com/scarb',
    'nargo': 'Install Noir toolchain from noir-lang.org',
    'bb': 'Included with Noir installation',
    'sncast': 'Install Starknet Foundry from foundry-rs.github.io/starknet-foundry'
  };
  
  return guides[toolName] || 'Please check the official documentation';
}

async function checkAllTools() {
  console.log('Checking installed tools...\n');
  
  for (const tool of tools) {
    await checkTool(tool);
  }
  
  console.log('\n' + '='.repeat(52));
  
  if (allInstalled) {
    console.log('🎉 All prerequisites are installed!');
    console.log('You can proceed with the Noir & Ztarknet integration.');
  } else {
    console.log('⚠️  Some prerequisites are missing.');
    console.log('Please install the missing tools before proceeding.');
    console.log('Refer to NOIR_ZTARKNET_DEPLOYMENT_GUIDE.md for detailed installation instructions.');
  }
}

checkAllTools();