# Simple Addition Circuit

This is a simple Noir circuit that proves knowledge of two numbers that sum to a public value.

## Circuit Logic

The circuit proves that:
```
x + y = sum
```

Where:
- `x` and `y` are private inputs
- `sum` is a public input

## Usage

Once you have the Noir toolchain installed:

1. Compile the circuit:
   ```bash
   nargo check
   ```

2. Execute the circuit to generate a witness:
   ```bash
   nargo execute witness
   ```

3. Generate a proof:
   ```bash
   bb prove --scheme ultra_honk --zk --oracle_hash starknet -b ./target/circuit.json -w ./target/witness.gz -o ./target
   ```

4. Generate a verification key:
   ```bash
   bb write_vk --scheme ultra_honk --oracle_hash starknet -b ./target/circuit.json -o ./target
   ```

## Integration with Ztarknet

This circuit can be integrated with Ztarknet by:

1. Using Garaga to generate a Cairo verifier contract
2. Deploying the verifier contract to Starknet
3. Submitting proofs to the contract for verification

See the main deployment guide for detailed instructions.