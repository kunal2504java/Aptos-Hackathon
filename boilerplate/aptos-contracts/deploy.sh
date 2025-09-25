#!/bin/bash

# Exit on error
set -e

echo "🚀 Deploying Aptos OmniBets contracts..."

# Check if aptos CLI is installed
if ! command -v aptos &> /dev/null; then
    echo "❌ Aptos CLI not found. Please install it first:"
    echo "   Windows: irm https://aptos.dev/scripts/install_cli.py | python"
    echo "   macOS/Linux: curl -fsSL \"https://aptos.dev/scripts/install_cli.py\" | python3"
    exit 1
fi

# Check if account is initialized
if ! aptos account list &> /dev/null; then
    echo "❌ No Aptos account found. Please initialize first:"
    echo "   aptos init --network testnet"
    exit 1
fi

# Get account address
echo "📋 Getting account address..."
ACCOUNT_ADDRESS=$(aptos account list --json | jq -r '.Result[0].account_address')
echo "📍 Account address: $ACCOUNT_ADDRESS"

# Fund account if needed
echo "💰 Checking account balance..."
aptos account fund-with-faucet --account default

# Deploy contracts
echo "📦 Deploying contracts..."
aptos move publish --named-addresses omnibets=default --assume-yes

echo "✅ Contracts deployed successfully!"
echo ""
echo "🔧 Next steps:"
echo "1. Update web/lib/aptos-client.ts with your contract address:"
echo "   PREDICTION_MARKET: \"$ACCOUNT_ADDRESS\""
echo "   MOCK_USDC: \"$ACCOUNT_ADDRESS\""
echo ""
echo "2. Restart your development server"
echo "3. Test market creation!"