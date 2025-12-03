import { RpcProvider, Account } from 'starknet';
import dotenv from 'dotenv';

dotenv.config();

const CONFIG = {
  L2_RPC_ENDPOINT: process.env.L2_RPC_ENDPOINT || 'http://localhost:9944',
  STARKNET_ACCOUNT_ADDRESS: process.env.STARKNET_ACCOUNT_ADDRESS || '0x0000000000000000000000000000000000000000000000000000000000000001',
  STARKNET_PRIVATE_KEY: process.env.STARKNET_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001'
};

export function getProvider(): RpcProvider {
  return new RpcProvider({ nodeUrl: CONFIG.L2_RPC_ENDPOINT });
}

export function getAccount(): Account {
  const provider = getProvider();
  return new Account(provider, CONFIG.STARKNET_ACCOUNT_ADDRESS, CONFIG.STARKNET_PRIVATE_KEY);
}

export async function checkNodeConnection(): Promise<boolean> {
  try {
    const provider = getProvider();
    await provider.getChainId();
    return true;
  } catch (error) {
    console.error('Failed to connect to Starknet node:', error);
    return false;
  }
}

export async function getAccountBalance(): Promise<bigint> {
  try {
    const provider = getProvider();
    // const balance = await provider.getBalance(CONFIG.STARKNET_ACCOUNT_ADDRESS);
    // return balance;
    return 0n;
  } catch (error) {
    console.error('Failed to get account balance:', error);
    return 0n;
  }
}

export async function getAccountNonce(): Promise<string> {
  try {
    const account = getAccount();
    const nonce = await account.getNonce();
    return nonce;
  } catch (error) {
    console.error('Failed to get account nonce:', error);
    return '0x0';
  }
}