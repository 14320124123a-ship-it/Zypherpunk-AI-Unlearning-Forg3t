#!/usr/bin/env node

const { RpcProvider } = require('starknet');

console.log('Checking Account Class Hash Availability');
console.log('================================');

// Use Alchemy RPC endpoint
const provider = new RpcProvider({
    nodeUrl: 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/21xJKr6s7H7ynN5UxElPx'
});

// Common account class hashes
const classHashes = [
    '0x0490400477682342b77245100265dc5a4943df1bc6f4bd9508009e9f7c0500a0', // OZ account v0.5.1
    '0x033434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2', // OZ account v0.6.1
    '0x02791fcafba156d4649755801a318253301c64a1a99508c6e8b042342d8145a2', // OZ account v0.7.0
    '0x048dd59fabc729a5db3afdf649ecaf388e931647ab2f53ca3c6183fa480aa292'  // OZ account v0.8.0
];

async function checkClassHashes() {
    try {
        console.log('\nChecking connection...');
        const chainId = await provider.getChainId();
        console.log(`Connected to StarkNet (Chain ID: ${chainId})`);
        
        console.log('\nChecking availability of common account class hashes:');
        
        for (const classHash of classHashes) {
            try {
                console.log(`\nChecking: ${classHash}`);
                const classObject = await provider.getClassAt(classHash);
                console.log(`  ✅ Found class object`);
                console.log(`  Type: ${classObject.type || 'Unknown'}`);
                if (classObject.abi) {
                    console.log(`  ABI length: ${classObject.abi.length} items`);
                }
            } catch (error) {
                if (error.message.includes('Class hash not found')) {
                    console.log(`  ❌ Not found on this network`);
                } else {
                    console.log(`  ❓ Error: ${error.message.substring(0, 50)}...`);
                }
            }
        }
        
        console.log('\nIf none of these work, you might need to:');
        console.log('1. Wait for RPC providers to be updated');
        console.log('2. Use a different RPC endpoint');
        console.log('3. Check StarkNet documentation for current class hashes');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkClassHashes();