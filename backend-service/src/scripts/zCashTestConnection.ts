#!/usr/bin/env ts-node
import dotenv from 'dotenv';
import { testConnection, getBlockchainInfo } from '../zcash/zCashClient';

dotenv.config();

async function testZcashConnection() {
  try {
    console.log('Testing connection to Zcash node...');
    console.log(`RPC Host: ${process.env.ZCASH_RPC_HOST || '127.0.0.1'}`);
    console.log(`RPC Port: ${process.env.ZCASH_RPC_PORT || '18232'}`);
    
    const isConnected = await testConnection();
    
    if (isConnected) {
      console.log('✅ Successfully connected to Zcash node!');
      
      const info = await getBlockchainInfo();
      console.log(`Network: ${info.chain}`);
      console.log(`Blocks: ${info.blocks}`);
      console.log(`Sync Status: ${info.initial_block_download_complete ? 'Fully synced' : 'Syncing'}`);
    } else {
      console.log('❌ Failed to connect to Zcash node');
      console.log('Please check that:');
      console.log('1. Your Zcash node is running');
      console.log('2. The RPC credentials are correct');
      console.log('3. The node is accessible from the backend service');
    }
  } catch (error) {
    console.error('Error testing Zcash connection:', error);
    process.exit(1);
  }
}

testZcashConnection();