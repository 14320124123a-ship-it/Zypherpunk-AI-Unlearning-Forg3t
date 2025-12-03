#!/usr/bin/env node
/**
 * Simple Blockchain Integration Test Script
 * Run this from the project root to quickly test blockchain integration
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🔍 Forg3t Protocol - Blockchain Integration Test');
console.log('================================================\n');

// Change to backend-service directory
const backendDir = path.join(__dirname, 'backend-service');

// Run the blockchain status check
const testProcess = spawn('npm', ['run', 'blockchain:status'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true
});

testProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Blockchain integration test completed successfully!');
    console.log('\nFor more detailed testing, try:');
    console.log('  cd backend-service && npm run blockchain:test');
  } else {
    console.log('\n❌ Blockchain integration test failed!');
    console.log('\nCheck the output above for details.');
    console.log('Ensure the backend service is running and configured correctly.');
  }
  
  process.exit(code);
});

testProcess.on('error', (error) => {
  console.error('Failed to start test process:', error);
  process.exit(1);
});