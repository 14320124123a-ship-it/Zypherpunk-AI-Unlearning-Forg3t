const { ec, hash, CallData, Account, RpcProvider } = require('starknet');
const fs = require('fs');

console.log('Setting up StarkNet Testnet Account');
console.log('===================================');

// 1. Generate a new private key
const privateKey = ec.starkCurve.utils.randomPrivateKey();
const privateKeyHex = '0x' + privateKey.toString('hex');

// 2. Get the public key from the private key
const publicKey = ec.starkCurve.getStarkKey(privateKey);

// 3. Calculate the account address using OpenZeppelin account class hash
const accountClassHash = '0x0490400477682342b77245100265dc5a4943df1bc6f4bd9508009e9f7c0500a0';
const accountAddress = hash.calculateContractAddressFromHash(
  publicKey,
  accountClassHash,
  [publicKey],
  0 // salt
);

console.log('\nNew StarkNet Account Details:');
console.log('============================');
console.log('Private Key:', privateKeyHex);
console.log('Public Key:', publicKey);
console.log('Account Address:', accountAddress);

// 4. Save to .env file
const envContent = `# Supabase Configuration
SUPABASE_URL=https://diauozuvbzggdnpwagjr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpYXVvenV2YnpnZ2RucHdhZ2pyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTIxMTYyNiwiZXhwIjoyMDY2Nzg3NjI2fQ.Ow4J8fOpLu64ihv7A4FGUEuuW8c-clOXPqgLk2ujZ4Y

# Ztarknet Configuration
L2_RPC_ENDPOINT=https://starknet-sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
STARKNET_ACCOUNT_ADDRESS=${accountAddress}
STARKNET_PRIVATE_KEY=${privateKeyHex}

# Zcash L1 Configuration
L1_RPC_ENDPOINT=http://localhost:18232
ZCASH_WALLET_MNEMONIC=equip will roof matter pink blind book anxiety banner elbow sun young
ZCASH_WALLET_INDEX=0

# Explorer Configuration
EXPLORER_PORT=3001`;

// Write to a new .env.testnet file
fs.writeFileSync('.env.testnet', envContent);

console.log('\n.env.testnet file created with testnet configuration');
console.log('====================================================');
console.log('Next steps to deploy and fund your account:');
console.log('1. Visit https://sepolia.starkgate.starknet.io/ to bridge ETH to your account');
console.log('2. Replace YOUR_INFURA_PROJECT_ID in the .env.testnet file with your actual Infura project ID');
console.log('3. Or use the public RPC endpoint: https://starknet-sepolia.public.blastapi.io');
console.log('4. To deploy the account contract, you would typically use Starknet.js or the Starknet CLI');

console.log('\nAccount Deployment Instructions:');
console.log('===============================');
console.log('To deploy your account to StarkNet Sepolia testnet:');
console.log('1. Fund your account with ETH on Sepolia using StarkGate (bridge ETH from Ethereum Sepolia)');
console.log('2. Use the following command with Starknet CLI (if available):');
console.log('   starknet deploy_account --network sepolia --wallet YOUR_WALLET');
console.log('3. Or deploy programmatically using Starknet.js');

console.log('\nSecurity Notes:');
console.log('===============');
console.log('⚠️  IMPORTANT: Store your private key securely!');
console.log('⚠️  NEVER commit your private key to version control!');
console.log('⚠️  This is a new account with no funds - you must bridge ETH to it first!');