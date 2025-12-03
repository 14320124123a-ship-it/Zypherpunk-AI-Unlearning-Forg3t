#!/usr/bin/env ts-node
import dotenv from 'dotenv';
import { getBlockchainInfo } from '../zcash/zCashClient';

dotenv.config();

async function printZcashInfo() {
  try {
    console.log('Fetching Zcash blockchain information...');
    
    console.log('Testing connection to Zcash node...');
    
    const info = await getBlockchainInfo();
    
    console.log('=====================================');
    console.log('Zcash Node Information');
    console.log('=====================================');
    console.log(`Network: ${info.chain}`);
    console.log(`Blocks: ${info.blocks}`);
    console.log(`Best block hash: ${info.bestblockhash}`);
    console.log(`Difficulty: ${info.difficulty}`);
    console.log(`Initial Block Download Complete: ${info.initial_block_download_complete ? 'Yes' : 'No'}`);
    if (info.estimatedheight) {
      console.log(`Estimated Height: ${info.estimatedheight}`);
    }
    if (info.chainSupply) {
      console.log(`Chain Supply: ${info.chainSupply.chainValue} ZEC`);
    }
    if (info.softforks) {
      console.log(`Soft Forks: ${Object.keys(info.softforks).join(', ')}`);
    }
    console.log('=====================================');
  } catch (error) {
    console.error('Error fetching Zcash information:', error);
    console.error('Please ensure your Zcash node is running and accessible at the configured RPC endpoint.');
    process.exit(1);
  }
}

printZcashInfo();