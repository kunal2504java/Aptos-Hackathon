module omnibets::mock_usdc {
    use aptos_framework::coin;
    use aptos_framework::managed_coin;

    /// Mock USDC token for betting
    struct MockUSDC {}

    /// Initialize the MockUSDC coin
    public entry fun initialize(account: &signer) {
        managed_coin::initialize<MockUSDC>(
            account,
            b"Mock USDC",
            b"MUSDC",
            6, // decimals
            false, // monitor_supply
        );
    }

    /// Mint MockUSDC tokens to an account
    public entry fun mint(account: &signer, to: address, amount: u64) {
        managed_coin::mint<MockUSDC>(account, to, amount);
    }

    /// Get the balance of MockUSDC for an account
    #[view]
    public fun balance_of(account: address): u64 {
        coin::balance<MockUSDC>(account)
    }

    /// Transfer MockUSDC from sender to recipient
    public fun transfer(from: &signer, to: address, amount: u64) {
        let coins = coin::withdraw<MockUSDC>(from, amount);
        coin::deposit(to, coins);
    }

    #[test_only]
    public fun setup_test(account: &signer) {
        initialize(account);
    }
}
