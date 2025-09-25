module omnibets::prediction_market {
    use std::signer;
    use std::string::String;
    use std::vector;
    use aptos_framework::coin;
    use omnibets::mock_usdc::MockUSDC;
    use omnibets::nft_rewards;

    /// Market state
    const MARKET_ACTIVE: u8 = 0;
    const MARKET_RESOLVED: u8 = 1;
    const MARKET_CANCELLED: u8 = 2;

    /// Market structure
    struct Market has key, store, copy, drop {
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
    struct UserPosition has key, copy, drop {
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
    const E_INSUFFICIENT_LIQUIDITY: u64 = 8;

    /// Initialize the market manager
    public entry fun initialize(account: &signer) {
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

    /// Entry wrapper for creating markets
    public entry fun create_market_entry(
        account: &signer,
        question: String,
        end_time: u64,
    ) acquires MarketManager {
        create_market(account, question, end_time);
        
        // Award NFT for market creation (temporarily disabled due to signer requirements)
        // let creator_addr = signer::address_of(account);
        // nft_rewards::record_market_creation(admin_signer, creator_addr);
    }

    /// Initialize liquidity for a market
    public entry fun initialize_liquidity(
        account: &signer,
        market_id: u64,
    ) acquires MarketManager {
        let market_manager = borrow_global_mut<MarketManager>(@omnibets);
        let market = vector::borrow_mut(&mut market_manager.markets, market_id - 1);
        
        assert!(market.state == MARKET_ACTIVE, E_MARKET_ALREADY_RESOLVED);
        assert!(!market.liquidity_initialized, E_LIQUIDITY_NOT_INITIALIZED);
        
        market.yes_quantity = 10000000; // 10M tokens initial liquidity
        market.no_quantity = 10000000;  // 10M tokens initial liquidity
        market.liquidity_initialized = true;
    }

    /// Buy tokens (YES or NO) for a market
    public entry fun buy_tokens(
        account: &signer,
        market_id: u64,
        is_yes_token: bool,
        amount: u64, // Number of tokens to buy
    ) acquires MarketManager, UserPosition {
        assert!(amount > 0, E_INVALID_AMOUNT);
        
        let market_manager = borrow_global_mut<MarketManager>(@omnibets);
        let market = vector::borrow_mut(&mut market_manager.markets, market_id - 1);
        
        assert!(market.state == MARKET_ACTIVE, E_MARKET_ALREADY_RESOLVED);
        assert!(market.liquidity_initialized, E_LIQUIDITY_NOT_INITIALIZED);
        
        // Check if there are enough tokens available
        if (is_yes_token) {
            assert!(market.yes_quantity >= amount, E_INSUFFICIENT_LIQUIDITY);
        } else {
            assert!(market.no_quantity >= amount, E_INSUFFICIENT_LIQUIDITY);
        };
        
        // Calculate cost using LMSR (simplified)
        // For now, use 1:1 ratio (1 token = 1 MockUSDC)
        let cost = amount;
        
        // Transfer MockUSDC from user
        let coins = coin::withdraw<MockUSDC>(account, cost);
        coin::deposit(@omnibets, coins);
        
        // Update market state
        market.total_staked = market.total_staked + cost;
        if (is_yes_token) {
            market.total_yes = market.total_yes + cost;
            market.yes_quantity = market.yes_quantity - amount; // Subtract tokens, not cost
        } else {
            market.total_no = market.total_no + cost;
            market.no_quantity = market.no_quantity - amount; // Subtract tokens, not cost
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
            position.yes_tokens = position.yes_tokens + amount; // Add tokens, not cost
        } else {
            position.no_tokens = position.no_tokens + amount; // Add tokens, not cost
        };
    }

    /// Resolve a market (internal function)
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

        // Award NFTs to winners and reset streaks for losers
        award_win_badges_and_update_streaks(account, market_id, is_yes_won);
    }

    /// Award win badges to winners and reset streaks for losers
    fun award_win_badges_and_update_streaks(
        admin: &signer,
        market_id: u64,
        is_yes_won: bool,
    ) acquires MarketManager {
        let market_manager = borrow_global<MarketManager>(@omnibets);
        let market = vector::borrow(&market_manager.markets, market_id - 1);
        
        let winning_side = if (is_yes_won) { 
            std::string::utf8(b"YES") 
        } else { 
            std::string::utf8(b"NO") 
        };

        // Calculate odds for NFT metadata
        let odds = if (is_yes_won && market.total_yes > 0) {
            std::string::utf8(b"1:")
        } else if (!is_yes_won && market.total_no > 0) {
            std::string::utf8(b"1:")
        } else {
            std::string::utf8(b"N/A")
        };

        // TODO: Iterate through all user positions and award NFTs to winners
        // This would require storing user positions in the contract
        // For now, this is a placeholder for the NFT awarding logic
        
        // Example: Award NFT to a specific user (this would be done for all winners)
        // nft_rewards::mint_win_badge(
        //     admin,
        //     winner_address,
        //     market_id,
        //     market.question,
        //     winning_side,
        //     odds,
        // );
        
        // Reset streaks for losers
        // nft_rewards::reset_win_streak(admin, loser_address);
    }

    /// Resolve a market (entry function for testing)
    public entry fun resolve_market_entry(
        account: &signer,
        market_id: u64,
        is_yes_won: bool,
    ) acquires MarketManager {
        resolve_market(account, market_id, is_yes_won);
    }

    /// Claim rewards after market resolution
    public fun claim_rewards(
        account: &signer,
        market_id: u64,
    ) acquires MarketManager, UserPosition {
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
            // For this demo, we'll just reset the position
            // In production, implement proper reward withdrawal mechanism
            
            // Reset position
            if (market.won) {
                position.yes_tokens = 0;
            } else {
                position.no_tokens = 0;
            };
        };
    }

    /// Claim rewards (entry function)
    public entry fun claim_rewards_entry(
        account: &signer,
        market_id: u64,
    ) acquires MarketManager, UserPosition {
        claim_rewards(account, market_id);
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
    #[view]
    public fun get_market(market_id: u64): Market acquires MarketManager {
        let market_manager = borrow_global<MarketManager>(@omnibets);
        *vector::borrow(&market_manager.markets, market_id - 1)
    }

    /// Get market count
    #[view]
    public fun get_market_count(): u64 acquires MarketManager {
        borrow_global<MarketManager>(@omnibets).market_count
    }

    /// Get user position
    #[view]
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
