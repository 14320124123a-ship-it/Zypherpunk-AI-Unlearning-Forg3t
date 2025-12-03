#[starknet::contract]
mod MyContract {
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    #[storage]
    struct Storage {
        counter: u128,
    }

    // External function: increase counter
    #[external(v0)]
    fn increase(ref self: ContractState, amount: u128) {
        assert(amount != 0, 'Amount cannot be zero');
        let current = self.counter.read();
        self.counter.write(current + amount);
    }

    // External function: get counter
    #[external(v0)]
    fn get(self: @ContractState) -> u128 {
        self.counter.read()
    }
}
