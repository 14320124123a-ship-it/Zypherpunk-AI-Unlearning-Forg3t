#!/usr/bin/env node

// Simple script to check what tools are available in the current environment

const { exec } = require('child_process');

const tools = [
  { name: 'Python', command: 'python --version' },
  { name: 'Node.js', command: 'node --version' },
  { name: 'npm', command: 'npm --version' },
  { name: 'Scarb', command: 'scarb --version' },
  { name: 'Git', command: 'git --version' },
  { name: 'Rust', command: 'rustc --version' },
  { name: 'Cargo', command: 'cargo --version' },
  { name: 'nargo', command: 'nargo --version' },
  { name: 'bb', command: 'bb --version' },
  { name: 'sncast', command: 'sncast --version' },
  { name: 'snforge', command: 'snforge --version' }
];

console.log('Checking available tools in the current environment...\n');

tools.forEach(tool => {
  exec(tool.command, (error, stdout, stderr) => {
    if (error) {
      console.log(`❌ ${tool.name}: Not available`);
    } else {
      const version = stdout || stderr;
      console.log(`✅ ${tool.name}: ${version.trim()}`);
    }
  });
});

// Also check if we can access our project files
const fs = require('fs');
const path = require('path');

console.log('\nChecking project files...');

const projectFiles = [
  'noir-circuit/src/main.nr',
  'cairo-contracts/src/lib.cairo',
  'scripts/build-cairo-contract.js'
];

projectFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file}: Found`);
  } else {
    console.log(`❌ ${file}: Not found`);
  }
});