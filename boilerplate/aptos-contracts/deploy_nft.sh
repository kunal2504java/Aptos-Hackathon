#!/bin/bash

# Deploy NFT Rewards System for OmniBets
echo "🎮 Deploying OmniBets NFT Rewards System..."

# Check if aptos CLI is installed
if ! command -v aptos &> /dev/null
then
    echo "❌ Aptos CLI not found. Please install it first."
    exit 1
fi

# Build and publish the contracts
echo "📦 Building contracts..."
aptos move compile

if [ $? -ne 0 ]; then
    echo "❌ Contract compilation failed"
    exit 1
fi

echo "🚀 Publishing contracts to testnet..."
aptos move publish --named-addresses omnibets=default

if [ $? -ne 0 ]; then
    echo "❌ Contract deployment failed"
    exit 1
fi

# Get the deployed address
DEPLOYED_ADDRESS=$(aptos config show-profiles --profile=default | grep "account" | awk '{print $2}')

echo "✅ Contracts deployed successfully!"
echo "📍 Deployed Address: $DEPLOYED_ADDRESS"

# Initialize the NFT collection
echo "🎨 Initializing NFT collection..."
aptos move run \
    --function-id ${DEPLOYED_ADDRESS}::nft_rewards::initialize \
    --args \
        string:"OmniBets Rewards" \
        string:"Exclusive NFT collection for OmniBets prediction market achievements and wins" \
        string:"https://omnibets.app/nft-collection" \
        u64:500

if [ $? -ne 0 ]; then
    echo "❌ NFT collection initialization failed"
    exit 1
fi

echo "🎉 NFT Rewards System deployed and initialized successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Update CONTRACT_ADDRESSES in web/lib/aptos-client.ts with: $DEPLOYED_ADDRESS"
echo "2. Test the NFT functionality in the web interface"
echo "3. Create some markets and place bets to earn NFTs!"
echo ""
echo "🔧 Useful commands:"
echo "- View collection: aptos move view --function-id ${DEPLOYED_ADDRESS}::nft_rewards::get_user_rewards --args address:YOUR_ADDRESS"
echo "- Manual NFT mint: aptos move run --function-id ${DEPLOYED_ADDRESS}::nft_rewards::mint_win_badge --args address:RECIPIENT u64:MARKET_ID string:QUESTION string:SIDE string:ODDS"
