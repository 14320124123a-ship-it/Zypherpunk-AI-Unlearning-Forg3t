#[starknet::interface]
trait IForg3tUnlearningRegistry<T> {
    fn push_proof(ref self: T);
    fn get_proof_count(self: @T) -> u128;
}

#[starknet::contract]
mod Forg3tUnlearningRegistry {
    use starknet::ContractAddress;
    use super::IForg3tUnlearningRegistry;
    
    #[storage]
    struct Storage {
        // Counter for unlearning proofs
        proof_counter: u128,
    }
    
    #[constructor]
    fn constructor(ref self: ContractState) {
        // Initialize proof counter to 0
        self.proof_counter.write(0);
    }
    
    #[abi(embed_v0)]
    impl Forg3tUnlearningRegistryImpl of super::IForg3tUnlearningRegistry<ContractState> {
        /// Increment the proof counter by 1
        fn push_proof(ref self: ContractState) {
            let current_count = self.proof_counter.read();
            self.proof_counter.write(current_count + 1);
        }
        
        /// Get the current proof count
        fn get_proof_count(self: @ContractState) -> u128 {
            self.proof_counter.read()
        }
    }
}