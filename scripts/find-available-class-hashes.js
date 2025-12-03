#!/usr/bin/env node

const { RpcProvider } = require('starknet');

console.log('Finding Available Account Class Hashes');
console.log('================================');

// Use the working Alchemy RPC endpoint
const provider = new RpcProvider({
    nodeUrl: 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/21xJKr6s7H7ynN5UxElPx'
});

// List of known account class hashes
const knownClassHashes = [
    {
        name: 'OZ Account v0.5.1',
        hash: '0x0490400477682342b77245100265dc5a4943df1bc6f4bd9508009e9f7c0500a0'
    },
    {
        name: 'OZ Account v0.6.1',
        hash: '0x033434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2'
    },
    {
        name: 'OZ Account v0.7.0',
        hash: '0x02791fcafba156d4649755801a318253301c64a1a99508c6e8b042342d8145a2'
    },
    {
        name: 'OZ Account v0.8.0',
        hash: '0x048dd59fabc729a5db3afdf649ecaf388e931647ab2f53ca3c6183fa480aa292'
    },
    {
        name: 'Argent Account v0.2.0',
        hash: '0x0299e9e7daf64cce4be04db459c5341fdb399d37297f80f802163bf0db0c987c'
    },
    {
        name: 'Braavos Account v1',
        hash: '0x03131fa018d520a037686ce3efddeab8f28895662f019ca3ca18a626650f7d1e'
    }
];

async function findAvailableClassHashes() {
    try {
        console.log('Checking connection...');
        const chainId = await provider.getChainId();
        console.log(`Connected to StarkNet (Chain ID: ${chainId})\n`);
        
        console.log('Testing known account class hashes:\n');
        
        const availableHashes = [];
        
        for (const { name, hash } of knownClassHashes) {
            try {
                console.log(`Testing ${name}: ${hash}`);
                // Try to get the class object
                const classObject = await provider.getClassByHash(hash);
                console.log(`  ✅ Available - ABI has ${classObject.abi ? classObject.abi.length : 0} items`);
                availableHashes.push({ name, hash });
            } catch (error) {
                if (error.message.includes('Class hash not found')) {
                    console.log(`  ❌ Not found on this network`);
                } else {
                    console.log(`  ❓ Error: ${error.message.substring(0, 50)}...`);
                }
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('Available Class Hashes:');
        if (availableHashes.length > 0) {
            availableHashes.forEach(({ name, hash }) => {
                console.log(`  ${name}: ${hash}`);
            });
        } else {
            console.log('  No account class hashes found on this network');
            console.log('  This might indicate a temporary RPC issue');
        }
        
        console.log('\nNext steps:');
        console.log('1. If no hashes are available, wait 24-48 hours and try again');
        console.log('2. Check StarkNet documentation for current class hashes');
        console.log('3. Monitor https://status.starknet.io/ for network updates');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

findAvailableClassHashes();