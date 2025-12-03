#[cfg(test)]
mod tests {
    use array::ArrayTrait;
    use starknet::contract_address_const;
    use starknet::syscalls::deploy_syscall;
    use traits::Into;

    use super::Forg3tUnlearningRegistry::Forg3tUnlearningRegistry;

    #[test]
    fn test_push_and_get_proof_count() {
        // Deploy the contract
        let mut calldata = array![];
        let contract_address = deploy_syscall(
            Forg3tUnlearningRegistry::TEST_CLASS_HASH,
            0,
            calldata.span(),
            false
        ).unwrap();

        // Convert contract address to dispatcher
        let dispatcher = IForg3tUnlearningRegistryDispatcher { contract_address };

        // Initially the counter should be 0
        let initial_count = dispatcher.get_proof_count();
        assert_eq!(initial_count, 0);

        // Push one proof
        dispatcher.push_proof();

        // Now the counter should be 1
        let count_after_first = dispatcher.get_proof_count();
        assert_eq!(count_after_first, 1);

        // Push another proof
        dispatcher.push_proof();

        // Now the counter should be 2
        let count_after_second = dispatcher.get_proof_count();
        assert_eq!(count_after_second, 2);
    }
}