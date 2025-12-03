// Convert the private key from byte array to proper hex format
const privateKeyBytes = [4,75,22,224,55,29,15,224,47,113,3,53,180,195,4,240,51,233,196,191,220,57,67,194,230,244,253,245,215,32,162,106];

// Convert byte array to BigInt
const privateKeyBigInt = privateKeyBytes.reduce((acc, byte) => (acc << 8n) + BigInt(byte), 0n);

// Convert to hex string
const privateKeyHex = '0x' + privateKeyBigInt.toString(16);

console.log('Fixed Private Key:', privateKeyHex);