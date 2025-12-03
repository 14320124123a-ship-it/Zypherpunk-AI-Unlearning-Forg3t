%lang starknet

@contract
namespace Hello {
    @external
    func hello() -> felt252 {
        return 12345;
    }
}

