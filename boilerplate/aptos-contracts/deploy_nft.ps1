# Deploy NFT Rewards System for OmniBets
Write-Host "🎮 Deploying OmniBets NFT Rewards System..." -ForegroundColor Green

# Check if aptos CLI is installed
if (-not (Get-Command aptos -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Aptos CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}

# Build and publish the contracts
Write-Host "📦 Building contracts..." -ForegroundColor Yellow
aptos move compile

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Contract compilation failed" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Publishing contracts to testnet..." -ForegroundColor Yellow
aptos move publish --named-addresses omnibets=default

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Contract deployment failed" -ForegroundColor Red
    exit 1
}

# Get the deployed address - use hardcoded since we know it
$DEPLOYED_ADDRESS = "0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23"

Write-Host "✅ Contracts deployed successfully!" -ForegroundColor Green
Write-Host "📍 Deployed Address: $DEPLOYED_ADDRESS" -ForegroundColor Cyan

# Initialize the NFT collection
Write-Host "🎨 Initializing NFT collection..." -ForegroundColor Yellow
aptos move run `
    --function-id "$DEPLOYED_ADDRESS::nft_rewards::initialize" `
    --args `
        "string:OmniBets Rewards" `
        "string:Exclusive NFT collection for OmniBets prediction market achievements and wins" `
        "string:https://omnibets.app/nft-collection" `
        "u64:500" `
    --profile default

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ NFT collection initialization failed" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 NFT Rewards System deployed and initialized successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update CONTRACT_ADDRESSES in web/lib/aptos-client.ts with: $DEPLOYED_ADDRESS"
Write-Host "2. Test the NFT functionality in the web interface"
Write-Host "3. Create some markets and place bets to earn NFTs!"
Write-Host ""
Write-Host "🔧 Useful commands:" -ForegroundColor Yellow
Write-Host "- View collection: aptos move view --function-id ${DEPLOYED_ADDRESS}::nft_rewards::get_user_rewards --args address:YOUR_ADDRESS"
Write-Host "- Manual NFT mint: aptos move run --function-id ${DEPLOYED_ADDRESS}::nft_rewards::mint_win_badge --args address:RECIPIENT u64:MARKET_ID string:QUESTION string:SIDE string:ODDS"
