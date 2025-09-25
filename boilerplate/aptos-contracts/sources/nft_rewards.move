module omnibets::nft_rewards {
    use std::string::String;
    use std::vector;
    use std::signer;
    use aptos_framework::timestamp;
    use aptos_framework::coin;
    use omnibets::mock_usdc::{Self, MockUSDC};

    // Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_USER_NOT_EXISTS: u64 = 2;
    const E_NFT_NOT_FOUND: u64 = 3;
    const E_NOT_OWNER: u64 = 4;
    const E_INSUFFICIENT_FUNDS: u64 = 5;
    const E_NFT_NOT_FOR_SALE: u64 = 6;
    const E_INVALID_PRICE: u64 = 7;
    const E_NFT_ALREADY_COLLATERALIZED: u64 = 8;
    const E_INSUFFICIENT_COLLATERAL: u64 = 9;
    const E_LOAN_NOT_FOUND: u64 = 10;
    const E_LOAN_NOT_ACTIVE: u64 = 11;

    // Simple user rewards tracking without actual NFT minting for now
    struct UserRewards has key {
        current_win_streak: u64,
        max_win_streak: u64,
        total_wins: u64,
        total_markets_created: u64,
        last_win_time: u64,
        achievements_earned: vector<u8>,
    }

    struct NFTRewardsConfig has key {
        admin: address,
        collection_name: String,
        collection_description: String,
        collection_uri: String,
        initialized: bool,
    }

    // Simple NFT representation for trading
    struct UserNFT has store, drop, copy {
        id: String,
        nft_type: u8, // 1 = win_badge, 2 = achievement, 3 = streak, 4 = seasonal
        name: String,
        description: String,
        rarity: u8, // 1 = common, 2 = rare, 3 = epic, 4 = legendary
        metadata: String, // JSON-like string with metadata
        created_at: u64,
    }

    struct UserNFTCollection has key {
        nfts: vector<UserNFT>,
        next_nft_id: u64,
    }

    // Marketplace listing
    struct NFTListing has store, drop, copy {
        listing_id: String,
        nft_id: String,
        seller: address,
        price: u64, // Price in MockUSDC (smallest units)
        currency: String,
        listed_at: u64,
        active: bool,
    }

    struct Marketplace has key {
        listings: vector<NFTListing>,
        next_listing_id: u64,
        total_volume: u64,
        total_sales: u64,
    }

    // NFT Lending System Structures
    struct NFTCollateral has store, drop, copy {
        nft_id: String,
        owner: address,
        market_id: u64,
        bet_amount: u64, // Amount borrowed against NFT
        collateral_value: u64, // NFT's estimated value
        loan_id: String,
        created_at: u64,
        active: bool,
    }

    struct NFTLoan has store, drop, copy {
        loan_id: String,
        borrower: address,
        nft_id: String,
        market_id: u64,
        bet_amount: u64,
        collateral_value: u64,
        created_at: u64,
        resolved: bool,
        won: bool,
    }

    struct LendingPool has key {
        active_collateral: vector<NFTCollateral>,
        loan_history: vector<NFTLoan>,
        next_loan_id: u64,
        total_lent: u64,
        total_recovered: u64,
    }

    // Initialize the NFT rewards system (simplified)
    public entry fun initialize(
        admin: &signer,
        collection_name: String,
        collection_description: String,
        collection_uri: String,
        _max_supply: u64, // Keep for compatibility but not used
    ) {
        let admin_addr = signer::address_of(admin);
        
        // Store configuration
        move_to(admin, NFTRewardsConfig {
            admin: admin_addr,
            collection_name,
            collection_description,
            collection_uri,
            initialized: true,
        });
    }

    // Initialize user rewards tracking
    public entry fun initialize_user_rewards(user: &signer) {
        let user_addr = signer::address_of(user);
        
        if (!exists<UserRewards>(user_addr)) {
            move_to(user, UserRewards {
                current_win_streak: 0,
                max_win_streak: 0,
                total_wins: 0,
                total_markets_created: 0,
                last_win_time: 0,
                achievements_earned: vector::empty(),
            });
        }
    }

    // Record a win (simplified - no actual NFT minting yet)
    public entry fun mint_win_badge(
        admin: &signer,
        recipient: address,
        _market_id: u64,
        _market_question: String,
        _winning_side: String,
        _odds: String,
    ) acquires NFTRewardsConfig, UserRewards {
        let admin_addr = signer::address_of(admin);
        let config = borrow_global<NFTRewardsConfig>(admin_addr);
        assert!(admin_addr == config.admin, E_NOT_AUTHORIZED);

        // Initialize user rewards if not exists
        if (!exists<UserRewards>(recipient)) {
            return
        };

        let user_rewards = borrow_global_mut<UserRewards>(recipient);
        user_rewards.total_wins = user_rewards.total_wins + 1;
        user_rewards.current_win_streak = user_rewards.current_win_streak + 1;
        
        if (user_rewards.current_win_streak > user_rewards.max_win_streak) {
            user_rewards.max_win_streak = user_rewards.current_win_streak;
        };
        
        user_rewards.last_win_time = timestamp::now_seconds();
        
        // TODO: Implement actual NFT minting when token standard is stable
    }

    // Record market creation
    public entry fun record_market_creation(admin: &signer, creator: address) acquires NFTRewardsConfig, UserRewards {
        let admin_addr = signer::address_of(admin);
        let config = borrow_global<NFTRewardsConfig>(admin_addr);
        assert!(admin_addr == config.admin, E_NOT_AUTHORIZED);

        if (!exists<UserRewards>(creator)) {
            return
        };

        let user_rewards = borrow_global_mut<UserRewards>(creator);
        user_rewards.total_markets_created = user_rewards.total_markets_created + 1;
        
        // TODO: Award achievement NFTs when token standard is stable
    }

    // Reset win streak (called when user loses)
    public entry fun reset_win_streak(admin: &signer, user: address) acquires NFTRewardsConfig, UserRewards {
        let admin_addr = signer::address_of(admin);
        let config = borrow_global<NFTRewardsConfig>(admin_addr);
        assert!(admin_addr == config.admin, E_NOT_AUTHORIZED);

        if (!exists<UserRewards>(user)) {
            return
        };

        let user_rewards = borrow_global_mut<UserRewards>(user);
        user_rewards.current_win_streak = 0;
    }

    // View functions
    #[view]
    public fun get_user_win_streak(user: address): (u64, u64) acquires UserRewards {
        if (!exists<UserRewards>(user)) {
            return (0, 0)
        };

        let user_rewards = borrow_global<UserRewards>(user);
        (user_rewards.current_win_streak, user_rewards.max_win_streak)
    }

    #[view]
    public fun get_user_rewards(user: address): (u64, u64, u64, u64, vector<u8>) acquires UserRewards {
        if (!exists<UserRewards>(user)) {
            return (0, 0, 0, 0, vector::empty())
        };

        let user_rewards = borrow_global<UserRewards>(user);
        (
            user_rewards.current_win_streak,
            user_rewards.total_wins,
            user_rewards.total_markets_created,
            user_rewards.last_win_time,
            user_rewards.achievements_earned,
        )
    }

    // User-callable function to mint win badge (now creates actual NFT)
    public entry fun mint_user_win_badge(
        user: &signer,
        market_id: u64,
        market_question: String,
    ) acquires UserRewards, UserNFTCollection {
        let user_addr = signer::address_of(user);
        
        // Initialize user rewards if not exists
        if (!exists<UserRewards>(user_addr)) {
            move_to(user, UserRewards {
                current_win_streak: 0,
                max_win_streak: 0,
                total_wins: 0,
                total_markets_created: 0,
                last_win_time: 0,
                achievements_earned: vector::empty(),
            });
        };

        // Initialize NFT collection if not exists
        if (!exists<UserNFTCollection>(user_addr)) {
            move_to(user, UserNFTCollection {
                nfts: vector::empty(),
                next_nft_id: 1,
            });
        };

        let user_rewards = borrow_global_mut<UserRewards>(user_addr);
        user_rewards.total_wins = user_rewards.total_wins + 1;
        user_rewards.current_win_streak = user_rewards.current_win_streak + 1;
        
        if (user_rewards.current_win_streak > user_rewards.max_win_streak) {
            user_rewards.max_win_streak = user_rewards.current_win_streak;
        };
        
        user_rewards.last_win_time = timestamp::now_seconds();
        
        // Actually mint the NFT to user's collection
        let collection = borrow_global_mut<UserNFTCollection>(user_addr);
        let nft_id = std::string::utf8(b"win_badge_");
        std::string::append(&mut nft_id, std::string::utf8(std::bcs::to_bytes(&collection.next_nft_id)));

        // Determine rarity based on market_id (higher market_id = rarer)
        let rarity = if (market_id >= 10) { 3 } else if (market_id >= 5) { 2 } else { 1 }; // 1=common, 2=rare, 3=epic

        // Create metadata string
        let metadata = std::string::utf8(b"{\"market_id\":");
        std::string::append(&mut metadata, std::string::utf8(std::bcs::to_bytes(&market_id)));
        std::string::append(&mut metadata, std::string::utf8(b",\"odds\":\"1.5:1\"}"));

        let new_nft = UserNFT {
            id: nft_id,
            nft_type: 1, // win_badge
            name: market_question,
            description: std::string::utf8(b"Victory badge for winning this prediction market"),
            rarity,
            metadata,
            created_at: timestamp::now_seconds(),
        };

        vector::push_back(&mut collection.nfts, new_nft);
        collection.next_nft_id = collection.next_nft_id + 1;
    }

    // User-callable function to mint achievement badge
    public entry fun mint_user_achievement(
        user: &signer,
        achievement_id: u8,
        achievement_name: String,
    ) acquires UserRewards {
        let user_addr = signer::address_of(user);
        
        // Initialize user rewards if not exists
        if (!exists<UserRewards>(user_addr)) {
            move_to(user, UserRewards {
                current_win_streak: 0,
                max_win_streak: 0,
                total_wins: 0,
                total_markets_created: 0,
                last_win_time: 0,
                achievements_earned: vector::empty(),
            });
        };

        let user_rewards = borrow_global_mut<UserRewards>(user_addr);
        
        // Check if achievement already earned
        if (!vector::contains(&user_rewards.achievements_earned, &achievement_id)) {
            vector::push_back(&mut user_rewards.achievements_earned, achievement_id);
        };
        
        // TODO: Implement actual NFT minting when token standard is stable
        // For now, just track the achievement
    }

    #[view]
    public fun is_initialized(admin: address): bool acquires NFTRewardsConfig {
        exists<NFTRewardsConfig>(admin) && borrow_global<NFTRewardsConfig>(admin).initialized
    }

    // === NFT TRADING FUNCTIONS ===

    // Initialize marketplace
    public entry fun initialize_marketplace(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        if (!exists<Marketplace>(admin_addr)) {
            move_to(admin, Marketplace {
                listings: vector::empty(),
                next_listing_id: 1,
                total_volume: 0,
                total_sales: 0,
            });
        }
    }

    // Initialize user NFT collection
    public entry fun initialize_user_nft_collection(user: &signer) {
        let user_addr = signer::address_of(user);
        if (!exists<UserNFTCollection>(user_addr)) {
            move_to(user, UserNFTCollection {
                nfts: vector::empty(),
                next_nft_id: 1,
            });
        }
    }

    // Mint NFT to user's collection (when they win or achieve something)
    public entry fun mint_nft_to_collection(
        user: &signer,
        nft_type: u8,
        name: String,
        description: String,
        rarity: u8,
        metadata: String,
    ) acquires UserNFTCollection {
        let user_addr = signer::address_of(user);
        
        // Initialize collection if needed
        if (!exists<UserNFTCollection>(user_addr)) {
            move_to(user, UserNFTCollection {
                nfts: vector::empty(),
                next_nft_id: 1,
            });
        };

        let collection = borrow_global_mut<UserNFTCollection>(user_addr);
        let nft_id = std::string::utf8(b"nft_");
        std::string::append(&mut nft_id, std::string::utf8(std::bcs::to_bytes(&collection.next_nft_id)));

        let new_nft = UserNFT {
            id: nft_id,
            nft_type,
            name,
            description,
            rarity,
            metadata,
            created_at: timestamp::now_seconds(),
        };

        vector::push_back(&mut collection.nfts, new_nft);
        collection.next_nft_id = collection.next_nft_id + 1;
    }

    // List NFT for sale
    public entry fun list_nft_for_sale(
        seller: &signer,
        nft_id: String,
        price: u64,
        currency: String,
    ) acquires UserNFTCollection, Marketplace, NFTRewardsConfig {
        let seller_addr = signer::address_of(seller);
        assert!(exists<UserNFTCollection>(seller_addr), E_USER_NOT_EXISTS);
        assert!(price > 0, E_INVALID_PRICE);

        // Find the NFT in user's collection
        let collection = borrow_global<UserNFTCollection>(seller_addr);
        let nft_found = false;
        let i = 0;
        while (i < vector::length(&collection.nfts)) {
            let nft = vector::borrow(&collection.nfts, i);
            if (nft.id == nft_id) {
                nft_found = true;
                break
            };
            i = i + 1;
        };
        assert!(nft_found, E_NFT_NOT_FOUND);

        // Get marketplace (assume initialized by admin)
        let config = borrow_global<NFTRewardsConfig>(@omnibets); // Use the module address
        let marketplace = borrow_global_mut<Marketplace>(config.admin);

        let listing_id = std::string::utf8(b"listing_");
        std::string::append(&mut listing_id, std::string::utf8(std::bcs::to_bytes(&marketplace.next_listing_id)));

        let new_listing = NFTListing {
            listing_id,
            nft_id,
            seller: seller_addr,
            price,
            currency,
            listed_at: timestamp::now_seconds(),
            active: true,
        };

        vector::push_back(&mut marketplace.listings, new_listing);
        marketplace.next_listing_id = marketplace.next_listing_id + 1;
    }

    // Buy NFT from marketplace
    public entry fun buy_nft(
        buyer: &signer,
        listing_id: String,
    ) acquires UserNFTCollection, Marketplace, NFTRewardsConfig {
        let buyer_addr = signer::address_of(buyer);
        
        // Initialize buyer's collection if needed
        if (!exists<UserNFTCollection>(buyer_addr)) {
            move_to(buyer, UserNFTCollection {
                nfts: vector::empty(),
                next_nft_id: 1,
            });
        };

        // Get marketplace
        let config = borrow_global<NFTRewardsConfig>(@omnibets);
        let marketplace = borrow_global_mut<Marketplace>(config.admin);

        // Find and update the listing
        let listing_found = false;
        let _listing_index = 0;
        let seller_addr = @0x0;
        let nft_id = std::string::utf8(b"");
        let price = 0;

        let i = 0;
        while (i < vector::length(&marketplace.listings)) {
            let listing = vector::borrow_mut(&mut marketplace.listings, i);
            if (listing.listing_id == listing_id && listing.active) {
                listing.active = false; // Mark as sold
                listing_found = true;
                _listing_index = i;
                seller_addr = listing.seller;
                nft_id = listing.nft_id;
                price = listing.price;
                break
            };
            i = i + 1;
        };
        assert!(listing_found, E_NFT_NOT_FOR_SALE);
        assert!(seller_addr != buyer_addr, E_NOT_OWNER); // Can't buy your own NFT

        // Transfer MockUSDC from buyer to seller
        coin::transfer<MockUSDC>(buyer, seller_addr, price);

        // Find and remove NFT from seller's collection
        let seller_collection = borrow_global_mut<UserNFTCollection>(seller_addr);
        let nft_to_transfer = UserNFT {
            id: std::string::utf8(b""),
            nft_type: 1,
            name: std::string::utf8(b""),
            description: std::string::utf8(b""),
            rarity: 1,
            metadata: std::string::utf8(b""),
            created_at: 0,
        };

        let j = 0;
        while (j < vector::length(&seller_collection.nfts)) {
            let nft = vector::borrow(&seller_collection.nfts, j);
            if (nft.id == nft_id) {
                nft_to_transfer = vector::remove(&mut seller_collection.nfts, j);
                break
            };
            j = j + 1;
        };

        // Add NFT to buyer's collection
        let buyer_collection = borrow_global_mut<UserNFTCollection>(buyer_addr);
        vector::push_back(&mut buyer_collection.nfts, nft_to_transfer);

        // Update marketplace stats
        marketplace.total_volume = marketplace.total_volume + price;
        marketplace.total_sales = marketplace.total_sales + 1;
    }

    // Cancel NFT listing
    public entry fun cancel_nft_listing(
        seller: &signer,
        listing_id: String,
    ) acquires Marketplace, NFTRewardsConfig {
        let seller_addr = signer::address_of(seller);

        // Get marketplace
        let config = borrow_global<NFTRewardsConfig>(@omnibets);
        let marketplace = borrow_global_mut<Marketplace>(config.admin);

        // Find and deactivate the listing
        let i = 0;
        while (i < vector::length(&marketplace.listings)) {
            let listing = vector::borrow_mut(&mut marketplace.listings, i);
            if (listing.listing_id == listing_id && listing.seller == seller_addr) {
                listing.active = false;
                break
            };
            i = i + 1;
        };
    }

    // === VIEW FUNCTIONS FOR MARKETPLACE ===

    #[view]
    public fun get_user_nfts(user: address): vector<UserNFT> acquires UserNFTCollection {
        if (!exists<UserNFTCollection>(user)) {
            return vector::empty()
        };
        let collection = borrow_global<UserNFTCollection>(user);
        *&collection.nfts
    }

    #[view]
    public fun get_marketplace_listings(): vector<NFTListing> acquires Marketplace, NFTRewardsConfig {
        let config = borrow_global<NFTRewardsConfig>(@omnibets);
        if (!exists<Marketplace>(config.admin)) {
            return vector::empty()
        };
        let marketplace = borrow_global<Marketplace>(config.admin);
        *&marketplace.listings
    }

    #[view]
    public fun get_marketplace_stats(): (u64, u64, u64) acquires Marketplace, NFTRewardsConfig {
        let config = borrow_global<NFTRewardsConfig>(@omnibets);
        if (!exists<Marketplace>(config.admin)) {
            return (0, 0, 0)
        };
        let marketplace = borrow_global<Marketplace>(config.admin);
        (marketplace.total_volume, marketplace.total_sales, vector::length(&marketplace.listings))
    }

    // === NFT LENDING SYSTEM FUNCTIONS ===

    // Initialize lending pool
    public entry fun initialize_lending_pool(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        if (!exists<LendingPool>(admin_addr)) {
            move_to(admin, LendingPool {
                active_collateral: vector::empty(),
                loan_history: vector::empty(),
                next_loan_id: 1,
                total_lent: 0,
                total_recovered: 0,
            });
        }
    }

    // Calculate NFT value based on rarity and type
    #[view]
    public fun calculate_nft_value(nft_type: u8, rarity: u8): u64 {
        let base_value = if (nft_type == 1) { 1000000 } // win_badge
                       else if (nft_type == 2) { 2000000 } // achievement
                       else if (nft_type == 3) { 1500000 } // streak
                       else { 500000 }; // seasonal

        let rarity_multiplier = if (rarity == 1) { 1 } // common
                              else if (rarity == 2) { 2 } // rare
                              else if (rarity == 3) { 5 } // epic
                              else { 10 }; // legendary

        base_value * rarity_multiplier
    }

    // Use NFT as collateral for betting
    public entry fun use_nft_as_collateral(
        borrower: &signer,
        nft_id: String,
        market_id: u64,
        bet_amount: u64,
    ) acquires UserNFTCollection, LendingPool, NFTRewardsConfig {
        let borrower_addr = signer::address_of(borrower);
        
        // Initialize borrower's collection if needed
        if (!exists<UserNFTCollection>(borrower_addr)) {
            move_to(borrower, UserNFTCollection {
                nfts: vector::empty(),
                next_nft_id: 1,
            });
        };

        // Find the NFT in borrower's collection
        let collection = borrow_global<UserNFTCollection>(borrower_addr);
        let nft_found = false;
        let nft_type = 1;
        let rarity = 1;
        let i = 0;
        while (i < vector::length(&collection.nfts)) {
            let nft = vector::borrow(&collection.nfts, i);
            if (nft.id == nft_id) {
                nft_found = true;
                nft_type = nft.nft_type;
                rarity = nft.rarity;
                break
            };
            i = i + 1;
        };
        assert!(nft_found, E_NFT_NOT_FOUND);

        // Calculate NFT value
        let collateral_value = calculate_nft_value(nft_type, rarity);
        assert!(bet_amount <= collateral_value, E_INSUFFICIENT_COLLATERAL);
        assert!(bet_amount > 0, E_INVALID_PRICE);

        // Check if NFT is already used as collateral
        let config = borrow_global<NFTRewardsConfig>(@omnibets);
        let lending_pool = borrow_global_mut<LendingPool>(config.admin);
        
        let j = 0;
        while (j < vector::length(&lending_pool.active_collateral)) {
            let collateral = vector::borrow(&lending_pool.active_collateral, j);
            assert!(collateral.nft_id != nft_id || !collateral.active, E_NFT_ALREADY_COLLATERALIZED);
            j = j + 1;
        };

        // Create loan ID
        let loan_id = std::string::utf8(b"loan_");
        std::string::append(&mut loan_id, std::string::utf8(std::bcs::to_bytes(&lending_pool.next_loan_id)));

        // Create collateral record
        let collateral = NFTCollateral {
            nft_id,
            owner: borrower_addr,
            market_id,
            bet_amount,
            collateral_value,
            loan_id,
            created_at: timestamp::now_seconds(),
            active: true,
        };

        // Create loan record
        let loan = NFTLoan {
            loan_id,
            borrower: borrower_addr,
            nft_id,
            market_id,
            bet_amount,
            collateral_value,
            created_at: timestamp::now_seconds(),
            resolved: false,
            won: false,
        };

        // Add to lending pool
        vector::push_back(&mut lending_pool.active_collateral, collateral);
        vector::push_back(&mut lending_pool.loan_history, loan);
        lending_pool.next_loan_id = lending_pool.next_loan_id + 1;
        lending_pool.total_lent = lending_pool.total_lent + bet_amount;

        // Note: In a real implementation, the lending pool would need to have MockUSDC
        // For now, we'll just record the loan without transferring tokens
        // The borrower would need to have MockUSDC to place the bet
        // TODO: Implement proper token minting from lending pool reserves
    }

    // Resolve NFT-backed bet (called when market resolves)
    public entry fun resolve_nft_loan(
        admin: &signer,
        loan_id: String,
        won: bool,
    ) acquires LendingPool, UserNFTCollection, NFTRewardsConfig {
        let admin_addr = signer::address_of(admin);
        let config = borrow_global<NFTRewardsConfig>(@omnibets);
        assert!(admin_addr == config.admin, E_NOT_AUTHORIZED);

        let lending_pool = borrow_global_mut<LendingPool>(config.admin);
        
        // Find and update the loan
        let loan_found = false;
        let borrower_addr = @0x0;
        let nft_id = std::string::utf8(b"");
        let bet_amount = 0;
        let collateral_value = 0;

        let i = 0;
        while (i < vector::length(&lending_pool.loan_history)) {
            let loan = vector::borrow_mut(&mut lending_pool.loan_history, i);
            if (loan.loan_id == loan_id && !loan.resolved) {
                loan.resolved = true;
                loan.won = won;
                loan_found = true;
                borrower_addr = loan.borrower;
                nft_id = loan.nft_id;
                bet_amount = loan.bet_amount;
                collateral_value = loan.collateral_value;
                break
            };
            i = i + 1;
        };
        assert!(loan_found, E_LOAN_NOT_FOUND);

        // Update active collateral
        let j = 0;
        while (j < vector::length(&lending_pool.active_collateral)) {
            let collateral = vector::borrow_mut(&mut lending_pool.active_collateral, j);
            if (collateral.loan_id == loan_id && collateral.active) {
                collateral.active = false;
                break
            };
            j = j + 1;
        };

        if (won) {
            // Borrower wins: they keep the NFT and get winnings
            // NFT remains in their collection
            lending_pool.total_recovered = lending_pool.total_recovered + bet_amount;
        } else {
            // Borrower loses: NFT is liquidated
            // Remove NFT from borrower's collection
            let borrower_collection = borrow_global_mut<UserNFTCollection>(borrower_addr);
            let k = 0;
            while (k < vector::length(&borrower_collection.nfts)) {
                let nft = vector::borrow(&borrower_collection.nfts, k);
                if (nft.id == nft_id) {
                    vector::remove(&mut borrower_collection.nfts, k);
                    break
                };
                k = k + 1;
            };
            
            // NFT is now owned by the lending pool (liquidated)
            lending_pool.total_recovered = lending_pool.total_recovered + collateral_value;
        };
    }

    // View functions for lending system
    #[view]
    public fun get_user_active_collateral(user: address): vector<NFTCollateral> acquires LendingPool, NFTRewardsConfig {
        let config = borrow_global<NFTRewardsConfig>(@omnibets);
        if (!exists<LendingPool>(config.admin)) {
            return vector::empty()
        };
        
        let lending_pool = borrow_global<LendingPool>(config.admin);
        let user_collateral = vector::empty<NFTCollateral>();
        
        let i = 0;
        while (i < vector::length(&lending_pool.active_collateral)) {
            let collateral = vector::borrow(&lending_pool.active_collateral, i);
            if (collateral.owner == user && collateral.active) {
                vector::push_back(&mut user_collateral, *collateral);
            };
            i = i + 1;
        };
        
        user_collateral
    }

    #[view]
    public fun get_lending_pool_stats(): (u64, u64, u64, u64) acquires LendingPool, NFTRewardsConfig {
        let config = borrow_global<NFTRewardsConfig>(@omnibets);
        if (!exists<LendingPool>(config.admin)) {
            return (0, 0, 0, 0)
        };
        
        let lending_pool = borrow_global<LendingPool>(config.admin);
        let active_count = 0;
        let i = 0;
        while (i < vector::length(&lending_pool.active_collateral)) {
            let collateral = vector::borrow(&lending_pool.active_collateral, i);
            if (collateral.active) {
                active_count = active_count + 1;
            };
            i = i + 1;
        };
        
        (lending_pool.total_lent, lending_pool.total_recovered, active_count, vector::length(&lending_pool.loan_history))
    }
}