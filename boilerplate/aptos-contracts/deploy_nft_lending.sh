#!/bin/bash

# Deploy NFT Rewards Contract with Lending System
echo "🚀 Deploying NFT Rewards Contract with Lending System..."

# Navigate to contracts directory
cd "$(dirname "$0")"

# Deploy the contract
echo "📦 Publishing NFT rewards contract..."
aptos move publish --profile default

if [ $? -eq 0 ]; then
    echo "✅ Contract deployed successfully!"
    
    # Get the deployed address
    DEPLOYED_ADDRESS=$(aptos account list --profile default | grep -o '0x[a-fA-F0-9]*' | head -1)
    echo "📍 Deployed address: $DEPLOYED_ADDRESS"
    
    # Initialize the NFT rewards system
    echo "🔧 Initializing NFT rewards system..."
    aptos move run \
        --function-id "$DEPLOYED_ADDRESS::nft_rewards::initialize" \
        --args string:"OmniBets NFT Collection" string:"Prediction market victory badges and achievements" string:"https://omnibets.com/nft-collection" u64:10000 \
        --profile default
    
    # Initialize marketplace
    echo "🏪 Initializing marketplace..."
    aptos move run \
        --function-id "$DEPLOYED_ADDRESS::nft_rewards::initialize_marketplace" \
        --profile default
    
    # Initialize lending pool
    echo "💰 Initializing lending pool..."
    aptos move run \
        --function-id "$DEPLOYED_ADDRESS::nft_rewards::initialize_lending_pool" \
        --profile default
    
    echo "🎉 NFT Lending System deployment complete!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Update contract address in web/lib/aptos-client.ts"
    echo "2. Test NFT lending functionality"
    echo "3. Mint some test NFTs for testing"
    
else
    echo "❌ Contract deployment failed!"
    exit 1
fi
