#!/bin/bash

# Aptos OmniBets Deployment Script
# This script deploys the Move contracts to Aptos testnet

echo "🚀 Starting Aptos OmniBets deployment..."

# Check if aptos CLI is installed
if ! command -v aptos &> /dev/null; then
    echo "❌ Aptos CLI not found. Please install it first:"
    echo "   curl -fsSL https://aptos.dev/scripts/install_cli.py | python3"
    exit 1
fi

# Set up account (you'll need to create one if it doesn't exist)
echo "📝 Setting up Aptos account..."
aptos init --network testnet

# Fund the account with testnet APT
echo "💰 Funding account with testnet APT..."
aptos account fund-with-faucet --account default

# Compile the Move contracts
echo "🔨 Compiling Move contracts..."
aptos move compile

# Publish the contracts
echo "📦 Publishing contracts to Aptos testnet..."
aptos move publish --profile default

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update the contract addresses in web/lib/aptos-client.ts"
echo "2. Run 'npm install' in the web directory"
echo "3. Start the development server with 'npm run dev'"
echo "4. Visit http://localhost:3000/aptos to test the application"
echo ""
echo "🔗 View your deployed contracts on Aptos Explorer:"
echo "https://explorer.aptoslabs.com/?network=testnet"
