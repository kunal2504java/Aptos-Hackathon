# Deploy NFT Marketplace Smart Contract
Write-Host "🚀 Deploying NFT Marketplace to Aptos Testnet..." -ForegroundColor Green

# Build the contract
Write-Host "📦 Building Move contract..." -ForegroundColor Yellow
aptos move compile --package-dir . --named-addresses omnibets=default

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Deploy the contract
Write-Host "🚀 Deploying contract..." -ForegroundColor Yellow
aptos move publish --package-dir . --named-addresses omnibets=default --profile=default

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

# Get the deployed address
$deployedAddress = (aptos config show-profiles --profile=default | Select-String "account" | ForEach-Object { $_.ToString().Split(":")[1].Trim() })

if (-not $deployedAddress) {
    Write-Host "⚠️  Could not retrieve deployed address from profile. Checking aptos account..." -ForegroundColor Yellow
    $deployedAddress = (aptos account show --profile=default | Select-String "Result" -A 20 | Select-String "address" | ForEach-Object { $_.ToString().Split('"')[3] })
}

if ($deployedAddress) {
    Write-Host "✅ Contract deployed successfully!" -ForegroundColor Green
    Write-Host "📍 Deployed Address: $deployedAddress" -ForegroundColor Cyan
    
    # Initialize the marketplace
    Write-Host "🏪 Initializing marketplace..." -ForegroundColor Yellow
    aptos move run --function-id "${deployedAddress}::nft_rewards::initialize_marketplace" --profile=default
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Marketplace initialized!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Marketplace initialization may have failed or was already initialized." -ForegroundColor Yellow
    }
    
    Write-Host "🎉 NFT Marketplace is ready for trading!" -ForegroundColor Green
    Write-Host "💡 Update your frontend CONTRACT_ADDRESSES to: $deployedAddress" -ForegroundColor Cyan
} else {
    Write-Host "❌ Could not retrieve deployed address!" -ForegroundColor Red
    Write-Host "💡 Please run 'aptos init --profile=default' if you haven't set up your profile." -ForegroundColor Yellow
    exit 1
}
