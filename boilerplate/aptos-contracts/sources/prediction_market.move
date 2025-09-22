module omnibets::prediction_market {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use omnibets::mock_usdc::MockUSDC;

    /// Market state
    const MARKET_ACTIVE: u8 = 0;
    const MARKET_RESOLVED: u8 = 1;
    const MARKET_CANCELLED: u8 = 2;

    /// Market structure
    struct Market has key {
        id: u64,
        question: String,
        end_time: u64,
        total_staked: u64,
        total_yes: u64,
        total_no: u64,
        state: u8,
        won: bool,
        creator: address,
        yes_quantity: u64,
        no_quantity: u64,
        liquidity_initialized: bool,
    }

    /// User position in a market
    struct UserPosition has key {
        yes_tokens: u64,
        no_tokens: u64,
    }

    /// Global market state
    struct MarketManager has key {
        markets: vector<Market>,
        market_count: u64,
        next_market_id: u64,
    }

    /// Events
    struct MarketCreated has drop, store {
        market_id: u64,
        question: String,
        end_time: u64,
        creator: address,
    }

    struct MarketUpdated has drop, store {
        market_id: u64,
        is_yes_token: bool,
        amount: u64,
        account: address,
        cost: u64,
    }

    struct MarketResolved has drop, store {
        market_id: u64,
        result: bool,
        total_staked: u64,
    }

    /// Errors
    const E_MARKET_NOT_FOUND: u64 = 1;
    const E_MARKET_ALREADY_RESOLVED: u64 = 2;
    const E_MARKET_NOT_ENDED: u64 = 3;
    const E_INSUFFICIENT_BALANCE: u64 = 4;
    const E_INVALID_AMOUNT: u64 = 5;
    const E_LIQUIDITY_NOT_INITIALIZED: u64 = 6;
    const E_UNAUTHORIZED: u64 = 7;

    /// Initialize the market manager
    public fun initialize(account: &signer) {
        let market_manager = MarketManager {
            markets: vector::empty(),
            market_count: 0,
            next_market_id: 1,
        };
        move_to(account, market_manager);
    }

    /// Create a new prediction market
    public fun create_market(
        account: &signer,
        question: String,
        end_time: u64,
    ): u64 acquires MarketManager {
        let market_id = borrow_global<MarketManager>(@omnibets).next_market_id;
        
        let market = Market {
            id: market_id,
            question,
            end_time,
            total_staked: 0,
            total_yes: 0,
            total_no: 0,
            state: MARKET_ACTIVE,
            won: false,
            creator: signer::address_of(account),
            yes_quantity: 0,
            no_quantity: 0,
            liquidity_initialized: false,
        };

        let market_manager = borrow_global_mut<MarketManager>(@omnibets);
        vector::push_back(&mut market_manager.markets, market);
        market_manager.market_count = market_manager.market_count + 1;
        market_manager.next_market_id = market_manager.next_market_id + 1;

        market_id
    }

    /// Initialize liquidity for a market
    public fun initialize_liquidity(
        account: &signer,
        market_id: u64,
    ) acquires MarketManager {
        let market_manager = borrow_global_mut<MarketManager>(@omnibets);
        let market = vector::borrow_mut(&mut market_manager.markets, market_id - 1);
        
        assert!(market.state == MARKET_ACTIVE, E_MARKET_ALREADY_RESOLVED);
        assert!(!market.liquidity_initialized, E_LIQUIDITY_NOT_INITIALIZED);
        
        market.yes_quantity = 1000000; // 1M tokens initial liquidity
        market.no_quantity = 1000000;  // 1M tokens initial liquidity
        market.liquidity_initialized = true;
    }

    /// Buy tokens (YES or NO) for a market
    public fun buy_tokens(
        account: &signer,
        market_id: u64,
        is_yes_token: bool,
        amount: u64,
    ) acquires MarketManager {
        assert!(amount > 0, E_INVALID_AMOUNT);
        
        let market_manager = borrow_global_mut<MarketManager>(@omnibets);
        let market = vector::borrow_mut(&mut market_manager.markets, market_id - 1);
        
        assert!(market.state == MARKET_ACTIVE, E_MARKET_ALREADY_RESOLVED);
        assert!(market.liquidity_initialized, E_LIQUIDITY_NOT_INITIALIZED);
        
        // Calculate cost using LMSR (simplified)
        let cost = calculate_cost(market, is_yes_token, amount);
        
        // Transfer MockUSDC from user
        let coins = coin::withdraw<MockUSDC>(account, cost);
        coin::deposit(@omnibets, coins);
        
        // Update market state
        market.total_staked = market.total_staked + cost;
        if (is_yes_token) {
            market.total_yes = market.total_yes + cost;
            market.yes_quantity = market.yes_quantity - amount;
        } else {
            market.total_no = market.total_no + cost;
            market.no_quantity = market.no_quantity - amount;
        };
        
        // Update user position
        let user_addr = signer::address_of(account);
        if (!exists<UserPosition>(user_addr)) {
            move_to(account, UserPosition {
                yes_tokens: 0,
                no_tokens: 0,
            });
        };
        
        let position = borrow_global_mut<UserPosition>(user_addr);
        if (is_yes_token) {
            position.yes_tokens = position.yes_tokens + amount;
        } else {
            position.no_tokens = position.no_tokens + amount;
        };
    }

    /// Resolve a market
    public fun resolve_market(
        account: &signer,
        market_id: u64,
        is_yes_won: bool,
    ) acquires MarketManager {
        let market_manager = borrow_global_mut<MarketManager>(@omnibets);
        let market = vector::borrow_mut(&mut market_manager.markets, market_id - 1);
        
        assert!(market.state == MARKET_ACTIVE, E_MARKET_ALREADY_RESOLVED);
        // Note: In production, add time check and authorization
        
        market.state = MARKET_RESOLVED;
        market.won = is_yes_won;
    }

    /// Claim rewards after market resolution
    public fun claim_rewards(
        account: &signer,
        market_id: u64,
    ) acquires MarketManager {
        let market_manager = borrow_global_mut<MarketManager>(@omnibets);
        let market = vector::borrow(&market_manager.markets, market_id - 1);
        
        assert!(market.state == MARKET_RESOLVED, E_MARKET_NOT_FOUND);
        
        let user_addr = signer::address_of(account);
        let position = borrow_global_mut<UserPosition>(user_addr);
        
        let reward_amount = if (market.won) {
            position.yes_tokens
        } else {
            position.no_tokens
        };
        
        if (reward_amount > 0) {
            // Mint reward tokens
            let coins = coin::withdraw<MockUSDC>(&signer::create_signer(@omnibets), reward_amount);
            coin::deposit(user_addr, coins);
            
            // Reset position
            if (market.won) {
                position.yes_tokens = 0;
            } else {
                position.no_tokens = 0;
            };
        };
    }

    /// Calculate cost using LMSR (simplified)
    fun calculate_cost(market: &Market, is_yes_token: bool, amount: u64): u64 {
        // Simplified LMSR calculation
        // In production, implement proper LMSR formula
        if (is_yes_token) {
            amount * 100 / 100 // 1:1 for simplicity
        } else {
            amount * 100 / 100 // 1:1 for simplicity
        }
    }

    /// Get market information
    public fun get_market(market_id: u64): Market acquires MarketManager {
        let market_manager = borrow_global<MarketManager>(@omnibets);
        *vector::borrow(&market_manager.markets, market_id - 1)
    }

    /// Get market count
    public fun get_market_count(): u64 acquires MarketManager {
        borrow_global<MarketManager>(@omnibets).market_count
    }

    /// Get user position
    public fun get_user_position(user_addr: address): UserPosition acquires UserPosition {
        if (exists<UserPosition>(user_addr)) {
            *borrow_global<UserPosition>(user_addr)
        } else {
            UserPosition {
                yes_tokens: 0,
                no_tokens: 0,
            }
        }
    }

    #[test_only]
    public fun setup_test(account: &signer) {
        initialize(account);
    }
}
