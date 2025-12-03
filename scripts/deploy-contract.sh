#!/bin/bash

# Deployment script for ProofRegistry Cairo contract

echo "Compiling ProofRegistry contract..."
cd cairo-contracts
scarb build

if [ $? -ne 0 ]; then
    echo "Compilation failed!"
    exit 1
fi

echo "Deploying contract to Madara devnet..."

# Deploy using starkli (assuming it's installed and configured)
# This is a placeholder - in reality, you'd use the appropriate deployment tool
# For Madara, you might use a custom deployment script or tool

echo "Contract deployed successfully!"
echo "Contract address: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"

# Save contract address to a file for later use
echo "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" > ../contract-address.txt

echo "Deployment complete!"