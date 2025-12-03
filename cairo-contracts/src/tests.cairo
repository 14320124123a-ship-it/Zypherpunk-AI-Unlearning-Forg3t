#[cfg(test)]
mod tests {
    use array::ArrayTrait;
    use starknet::contract_address_const;
    use starknet::syscalls::deploy_syscall;
    use traits::Into;

    use super::ProofRegistry::ProofRegistry;

    #[test]
    fn test_store_and_get_proof() {
        // Deploy the contract
        let mut calldata = array![];
        let contract_address = deploy_syscall(
            ProofRegistry::TEST_CLASS_HASH,
            0,
            calldata.span(),
            false
        ).unwrap();

        // Convert contract address to dispatcher
        let dispatcher = IProofRegistryDispatcher { contract_address };

        // Test storing a proof
        let job_id = 123_felt252;
        let proof_hash = 456_felt252;
        
        dispatcher.store_proof(job_id, proof_hash);

        // Test retrieving the proof
        let (retrieved_hash, timestamp) = dispatcher.get_proof(job_id);
        
        assert_eq!(retrieved_hash, proof_hash);
        assert_ne!(timestamp, 0); // Timestamp should be non-zero
        
        // Test job count
        let count = dispatcher.get_job_count();
        assert_eq!(count, 1);
    }
}