#[starknet::contract]
mod Forg3tUnlearningRegistry {
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    #[storage]
    struct Storage {
        proof_counter: u128,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.proof_counter.write(0);
    }

    #[external(v0)]
    fn push_proof(ref self: ContractState) {
        let current = self.proof_counter.read();
        self.proof_counter.write(current + 1);
    }

    #[external(v0)]
    fn get_proof_count(self: @ContractState) -> u128 {
        self.proof_counter.read()
    }
}
