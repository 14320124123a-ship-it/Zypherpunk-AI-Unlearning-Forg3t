#[cfg(test)]
mod tests;

use starknet::ContractAddress;

#[starknet::interface]
trait IProofRegistry<T> {
    fn store_proof(ref self: T, job_id: felt252, proof_hash: felt252);
    fn get_proof(self: @T, job_id: felt252) -> (felt252, u64); // Returns (proof_hash, timestamp)
    fn get_job_count(self: @T) -> u64;
    fn verify_noir_proof(ref self: T, job_id: felt252, proof_data: Array<felt252>) -> bool;
}

#[starknet::contract]
mod ProofRegistry {
    use starknet::{get_block_timestamp, ContractAddress};
    use super::IProofRegistry;
    
    #[storage]
    struct Storage {
        // Mapping from job_id to (proof_hash, timestamp)
        proofs: LegacyMap<felt252, (felt252, u64)>,
        // Total number of jobs stored
        job_count: u64,
        // Mapping from job_id to verification status
        verification_status: LegacyMap<felt252, bool>,
    }
    
    #[constructor]
    fn constructor(ref self: ContractState) {
        self.job_count.write(0);
    }
    
    #[abi(embed_v0)]
    impl ProofRegistryImpl of super::IProofRegistry<ContractState> {
        /// Store a proof hash for a given job ID
        fn store_proof(ref self: ContractState, job_id: felt252, proof_hash: felt252) {
            let timestamp = get_block_timestamp();
            self.proofs.write(job_id, (proof_hash, timestamp));
            self.job_count.write(self.job_count.read() + 1);
        }
        
        /// Retrieve proof hash and timestamp for a given job ID
        fn get_proof(self: @ContractState, job_id: felt252) -> (felt252, u64) {
            self.proofs.read(job_id)
        }
        
        /// Get total number of jobs stored
        fn get_job_count(self: @ContractState) -> u64 {
            self.job_count.read()
        }
        
        /// Verify a Noir proof (stub implementation)
        fn verify_noir_proof(ref self: ContractState, job_id: felt252, proof_data: Array<felt252>) -> bool {
            // This is a stub implementation - in a real implementation,
            // this would call the actual verifier contract
            
            // For demonstration purposes, we'll just check if the proof_data array is not empty
            let is_valid = proof_data.len() > 0;
            
            // Store the verification result
            self.verification_status.write(job_id, is_valid);
            
            is_valid
        }
    }
}