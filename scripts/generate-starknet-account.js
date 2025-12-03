const { ec, hash, number } = require('starknet');

// Generate a new private key
const privateKey = ec.starkCurve.utils.randomPrivateKey();
const privateKeyHex = '0x' + privateKey.toString(16);

// Get the public key from the private key
const publicKey = ec.starkCurve.getStarkKey(privateKey);
const publicKeyHex = '0x' + publicKey.toString(16);

// Calculate the account address
const accountAddress = hash.calculateContractAddressFromHash(
  publicKey,
  '0x0490400477682342b77245100265dc5a4943df1bc6f4bd9508009e9f7c0500a0', // OpenZeppelin account class hash
  [publicKey],
  0 // salt
);

console.log('StarkNet Account Details:');
console.log('========================');
console.log('Private Key:', privateKeyHex);
console.log('Public Key:', publicKeyHex);
console.log('Account Address:', accountAddress);

// Save to .env file format
console.log('\n.env format:');
console.log('STARKNET_ACCOUNT_ADDRESS=' + accountAddress);
console.log('STARKNET_PRIVATE_KEY=' + privateKeyHex);