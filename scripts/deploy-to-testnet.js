const { RpcProvider, Account, Contract, cairo, CallData } = require('starknet');
const fs = require('fs');

console.log('StarkNet Testnet Contract Deployment Script');
console.log('==========================================');

// This script provides guidance for deploying the ProofRegistry contract to StarkNet Sepolia testnet
// Note: This requires the compiled Cairo contract artifacts

console.log('\nPrerequisites:');
console.log('=============');
console.log('1. StarkNet account with funded ETH on Sepolia testnet');
console.log('2. Compiled Cairo contract (ProofRegistry.sierra.json and ProofRegistry.casm.json)');
console.log('3. Starknet.js library installed');

console.log('\nDeployment Steps:');
console.log('================');

console.log('\n1. Compile the Cairo contract:');
console.log('   cd cairo-contracts');
console.log('   scarb build');

console.log('\n2. Deploy using Starknet.js:');
console.log('   # This is a simplified example - actual deployment would require the compiled artifacts');
console.log('   # The actual deployment code would look something like this:');

console.log(`
   const provider = new RpcProvider({
     nodeUrl: 'https://starknet-sepolia.public.blastapi.io'
   });

   const account = new Account(
     provider,
     process.env.STARKNET_ACCOUNT_ADDRESS,
     process.env.STARKNET_PRIVATE_KEY
   );

   // Read the compiled contract
   const compiledSierra = await account.declare({
     contract: JSON.parse(fs.readFileSync('path/to/ProofRegistry.sierra.json').toString()),
     casm: JSON.parse(fs.readFileSync('path/to/ProofRegistry.casm.json').toString())
   });

   // Deploy the contract
   const { transaction_hash, contract_address } = await account.deployContract({
     classHash: compiledSierra.class_hash,
     constructorCalldata: CallData.compile([])
   });

   console.log('Contract deployed at:', contract_address);
`);

console.log('\n3. Update your .env file with the deployed contract address');

console.log('\nAlternative - Use Starkli CLI:');
console.log('=============================');
console.log('1. Install Starkli: https://github.com/xJonathanLEI/starkli');
console.log('2. Declare the contract:');
console.log('   starkli declare target/dev/ProofRegistry.sierra.json --network sepolia');
console.log('3. Deploy the contract:');
console.log('   starkli deploy <CLASS_HASH> --network sepolia');

console.log('\nFor more information, visit:');
console.log('- https://book.starknet.io/chapter_1/index.html');
console.log('- https://starknetjs.com/');
console.log('- https://github.com/xJonathanLEI/starkli');