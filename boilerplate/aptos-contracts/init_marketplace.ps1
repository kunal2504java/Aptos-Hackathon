# Initialize NFT Marketplace
Write-Host "🏪 Initializing NFT Marketplace..." -ForegroundColor Green

$contractAddress = "0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23"

# Initialize marketplace
Write-Host "🚀 Setting up marketplace infrastructure..." -ForegroundColor Yellow
aptos move run --function-id "${contractAddress}::nft_rewards::initialize_marketplace" --profile=default

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Marketplace initialized successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Marketplace may already be initialized or there was an error." -ForegroundColor Yellow
}

# Initialize user NFT collection (optional - users can do this themselves)
Write-Host "👤 Initializing your NFT collection..." -ForegroundColor Yellow
aptos move run --function-id "${contractAddress}::nft_rewards::initialize_user_nft_collection" --profile=default

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Your NFT collection initialized!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Collection may already be initialized." -ForegroundColor Yellow
}

Write-Host "🎉 Marketplace setup complete!" -ForegroundColor Green
Write-Host "💡 Users can now:" -ForegroundColor Cyan
Write-Host "   • Mint NFTs from their wins" -ForegroundColor White
Write-Host "   • List NFTs for sale" -ForegroundColor White  
Write-Host "   • Buy NFTs from other players" -ForegroundColor White
Write-Host "   • View marketplace analytics" -ForegroundColor White
