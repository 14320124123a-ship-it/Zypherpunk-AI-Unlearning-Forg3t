#!/usr/bin/env node

const { ec, hash, CallData, Account, RpcProvider } = require('starknet');
const fs = require('fs');
const path = require('path');

console.log('Generating New StarkNet Account');
console.log('==========================');

// Use an available class hash (OZ Account v0.6.1)
const AVAILABLE_ACCOUNT_CLASS_HASH = '0x033434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2';

// Generate a new private key
const privateKey = ec.starkCurve.utils.randomPrivateKey();
const privateKeyHex = '0x' + privateKey.toString(16);

// Get the public key from the private key
const publicKey = ec.starkCurve.getStarkKey(privateKey);

// Calculate the account address using the available class hash
const accountAddress = hash.calculateContractAddressFromHash(
    publicKey,
    AVAILABLE_ACCOUNT_CLASS_HASH,
    [publicKey],
    0 // salt
);

console.log('New StarkNet Account Details:');
console.log('==========================');
console.log('Private Key:', privateKeyHex);
console.log('Public Key:', publicKey);
console.log('Account Address:', accountAddress);

// Save to a new file to avoid overwriting the existing one
const newEnvContent = `# Supabase Configuration
SUPABASE_URL=https://diauozuvbzggdnpwagjr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpYXVvenV2YnpnZ2RucHdhZ2pyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTIxMTYyNiwiZXhwIjoyMDY2Nzg3NjI2fQ.Ow4J8fOpLu64ihv7A4FGUEuuW8c-clOXPqgLk2ujZ4Y

# Ztarknet Configuration (StarkNet Sepolia Testnet)
L2_RPC_ENDPOINT=https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/21xJKr6s7H7ynN5UxElPx
CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
STARKNET_ACCOUNT_ADDRESS=${accountAddress}
STARKNET_PRIVATE_KEY=${privateKeyHex}

# Zcash L1 Configuration
L1_RPC_ENDPOINT=http://localhost:18232
ZCASH_WALLET_MNEMONIC=equip will roof matter pink blind book anxiety banner elbow sun young
ZCASH_WALLET_INDEX=0

# Explorer Configuration
EXPLORER_PORT=3001`;

// Write to a new .env file
const newEnvPath = path.join(__dirname, '..', '.env.testnet.new');
fs.writeFileSync(newEnvPath, newEnvContent);

console.log('\n.env.testnet.new file created with new account configuration');
console.log('========================================================');
console.log('Next steps to deploy and fund your new account:');
console.log('1. Visit https://sepolia.starkgate.starknet.io/ to bridge ETH to your new account');
console.log('2. Run the deployment script to deploy the new account');
console.log('3. Transfer funds from your old account to the new one (once both are deployed)');
console.log('4. Update your project configuration to use the new account');

console.log('\nSecurity Notes:');
console.log('===============');
console.log('⚠️  IMPORTANT: Store your private key securely!');
console.log('⚠️  NEVER commit your private key to version control!');
console.log('⚠️  This is a new account with no funds - you must bridge ETH to it first!');