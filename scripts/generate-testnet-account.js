const { ec, hash } = require('starknet');
const fs = require('fs');

console.log('Generating StarkNet Testnet Account');
console.log('==================================');

// Generate a new private key
const privateKey = ec.starkCurve.utils.randomPrivateKey();
const privateKeyHex = '0x' + Buffer.from(privateKey).toString('hex');

// Get the public key from the private key
const publicKey = ec.starkCurve.getStarkKey(privateKey);

// Calculate the account address using OpenZeppelin account class hash
const accountClassHash = '0x0490400477682342b77245100265dc5a4943df1bc6f4bd9508009e9f7c0500a0';
const accountAddress = hash.calculateContractAddressFromHash(
  publicKey,
  accountClassHash,
  [publicKey],
  0 // salt
);

console.log('\nGenerated StarkNet Testnet Account:');
console.log('==================================');
console.log('Private Key:', privateKeyHex);
console.log('Public Key:', publicKey);
console.log('Account Address:', accountAddress);

// Create a .env.testnet file with the new configuration
const testnetEnvContent = `# Supabase Configuration
SUPABASE_URL=https://diauozuvbzggdnpwagjr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpYXVvenV2YnpnZ2RucHdhZ2pyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTIxMTYyNiwiZXhwIjoyMDY2Nzg3NjI2fQ.Ow4J8fOpLu64ihv7A4FGUEuuW8c-clOXPqgLk2ujZ4Y

# Ztarknet Configuration (StarkNet Sepolia Testnet)
L2_RPC_ENDPOINT=https://starknet-sepolia.public.blastapi.io
CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
STARKNET_ACCOUNT_ADDRESS=${accountAddress}
STARKNET_PRIVATE_KEY=${privateKeyHex}

# Zcash L1 Configuration
L1_RPC_ENDPOINT=http://localhost:18232
ZCASH_WALLET_MNEMONIC=equip will roof matter pink blind book anxiety banner elbow sun young
ZCASH_WALLET_INDEX=0

# Explorer Configuration
EXPLORER_PORT=3001`;

fs.writeFileSync('.env.testnet', testnetEnvContent);

console.log('\n.env.testnet file has been created with your new testnet account configuration.');
console.log('\nNext steps:');
console.log('===========');
console.log('1. Fund your account with ETH on StarkNet Sepolia testnet:');
console.log('   - Visit https://sepolia.starkgate.starknet.io/');
console.log('   - Bridge ETH from Ethereum Sepolia to your StarkNet account');
console.log('');
console.log('2. To use this configuration, copy .env.testnet to .env in the backend-service directory');
console.log('');
console.log('3. Update the CONTRACT_ADDRESS with your deployed ProofRegistry contract address');
console.log('');
console.log('⚠️  IMPORTANT: Store your private key securely and never share it!');
console.log('⚠️  This is a new account with no funds - you must bridge ETH to it first!');