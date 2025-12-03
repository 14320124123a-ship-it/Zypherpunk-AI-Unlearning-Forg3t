#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Verifying Noir & Ztarknet Integration');
console.log('=====================================');

// List of expected files and directories
const expectedPaths = [
  'noir-circuit/',
  'noir-circuit/src/',
  'noir-circuit/src/main.nr',
  'noir-circuit/Prover.toml',
  'noir-circuit/README.md',
  'cairo-contracts/src/lib.cairo',
  'cairo-contracts/Scarb.toml',
  'scripts/build-cairo-contract.js',
  'scripts/deploy-cairo-contract.js',
  'scripts/check-prerequisites.js',
  'NOIR_ZTARKNET_DEPLOYMENT_GUIDE.md',
  'NOIR_INTEGRATION_GUIDE.md',
  'NOIR_ZTARKNET_INTEGRATION_SUMMARY.md',
  'COMPLETE_INTEGRATION_SUMMARY.md',
  'USAGE_EXAMPLES.md',
  'Makefile'
];

let allPresent = true;

console.log('Checking for expected files and directories...\n');

expectedPaths.forEach(expectedPath => {
  const fullPath = path.join(__dirname, '..', expectedPath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${expectedPath}`);
  } else {
    console.log(`❌ ${expectedPath}`);
    allPresent = false;
  }
});

console.log('\n' + '='.repeat(42));

if (allPresent) {
  console.log('🎉 All expected files and directories are present!');
  console.log('The Noir & Ztarknet integration is properly set up.');
} else {
  console.log('⚠️  Some expected files or directories are missing.');
  console.log('Please check the integration setup.');
}

// Check package.json scripts
console.log('\nChecking package.json scripts...');
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredScripts = [
    'cairo:build',
    'cairo:deploy',
    'prerequisites:check'
  ];
  
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`✅ npm run ${script}`);
    } else {
      console.log(`❌ npm run ${script}`);
      allPresent = false;
    }
  });
} else {
  console.log('❌ package.json not found');
  allPresent = false;
}

console.log('\n' + '='.repeat(42));

if (allPresent) {
  console.log('🎉 Integration verification completed successfully!');
  console.log('You can now proceed with installing the required tools');
  console.log('and testing the Noir circuit.');
} else {
  console.log('⚠️  Integration verification completed with issues.');
  console.log('Please review the missing components above.');
}