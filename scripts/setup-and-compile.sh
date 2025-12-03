#!/bin/bash

echo "Setting up Scarb and compiling Cairo contracts"
echo "============================================="

# Check if Scarb is installed
if ! command -v scarb &> /dev/null
then
    echo "Scarb could not be found, installing..."
    
    # Install Scarb using the official installation script
    curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh
    
    # Add Scarb to PATH
    source ~/.bashrc
else
    echo "Scarb is already installed"
fi

# Verify installation
echo "Verifying Scarb installation..."
scarb --version

# Navigate to cairo-contracts directory
echo "Navigating to cairo-contracts directory..."
cd cairo-contracts

# Build the contract
echo "Building the contract..."
scarb build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Contract compiled successfully!"
    echo "Artifacts are located in: target/dev/"
else
    echo "❌ Contract compilation failed!"
    exit 1
fi