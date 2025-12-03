// Simple script to generate a proper StarkNet testnet account
const crypto = require('crypto');

console.log('Generating StarkNet Testnet Account');
console.log('==================================');

// Generate a random 32-byte private key
const privateKeyBuffer = crypto.randomBytes(32);
const privateKeyHex = '0x' + privateKeyBuffer.toString('hex');

// For public key and account address, we would normally use StarkNet libraries
// But for this example, we'll use placeholder values
const publicKey = '0x' + crypto.randomBytes(32).toString('hex').slice(0, 64);
const accountAddress = '0x' + crypto.randomBytes(32).toString('hex').slice(0, 64);

console.log('\nGenerated StarkNet Testnet Account:');
console.log('==================================');
console.log('Private Key:', privateKeyHex);
console.log('Public Key:', publicKey);
console.log('Account Address:', accountAddress);

console.log('\nTo use StarkNet Sepolia Testnet:');
console.log('===============================');
console.log('1. RPC Endpoint: https://starknet-sepolia.public.blastapi.io');
console.log('2. Fund your account at: https://sepolia.starkgate.starknet.io/');
console.log('3. Contract address will need to be updated after deployment');

console.log('\n⚠️  IMPORTANT: This is a sample account for demonstration.');
console.log('⚠️  For a real implementation, use the StarkNet SDK to generate proper keys.');