# Forg3t Unlearning Registry Cairo Contracts

This directory contains the Cairo smart contracts for the Forg3t Unlearning Registry on Starknet.

## Contract Overview

The `Forg3tUnlearningRegistry` contract is a simple registry that keeps a counter of how many "unlearning proofs" have been registered on chain.

### Storage

- `proof_counter: u128` - A counter for unlearning proofs

### Entry Points

1. `constructor(ref self: ContractState)`
   - Initializes proof_counter to 0

2. `push_proof(ref self: ContractState)`
   - Reads the current proof_counter
   - Increments it by 1
   - Writes it back
   - Takes no arguments

3. `get_proof_count(self: @ContractState) -> u128`
   - Returns the current value of proof_counter

## Building the Contracts

To build the contracts, you need to have Scarb installed. Run the following command:

```bash
scarb build
```

## Deploying the Contracts

To deploy the contracts, you need to have Starknet Foundry installed. Run the following commands:

1. Declare the contract:
   ```bash
   sncast declare --contract-name Forg3tUnlearningRegistry
   ```

2. Deploy the contract:
   ```bash
   sncast deploy --class-hash <CLASS_HASH>
   ```

## Interacting with the Contracts

### Calling View Functions

To get the current proof count:

```bash
sncast call --contract-address <CONTRACT_ADDRESS> --function get_proof_count
```

### Invoking State-Changing Functions

To push a new proof:

```bash
sncast invoke --contract-address <CONTRACT_ADDRESS> --function push_proof
```

## Contract Address

The contract is deployed on Starknet Sepolia testnet at:
`0x074780159de36063c7560a170f5f3cdc4eb1405a7b574e1250998f69be4391c0`

## RPC Endpoint

The RPC endpoint for Starknet Sepolia is:
`https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/21xJKr6s7H7ynN5UxElPx`