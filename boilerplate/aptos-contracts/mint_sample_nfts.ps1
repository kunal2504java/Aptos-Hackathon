# Mint Sample NFTs for Testing the Marketplace
Write-Host "🎨 Minting Sample NFTs for Marketplace Testing..." -ForegroundColor Green

$contractAddress = "0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23"

# Mint a win badge NFT for market 14 (which was resolved as YES)
Write-Host "🏆 Minting Win Badge for Market 14..." -ForegroundColor Yellow
aptos move run --function-id "${contractAddress}::nft_rewards::mint_user_win_badge" --args "u64:14" "string:Will The NFT Feature Work" --profile=default

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Win Badge NFT minted successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Win Badge minting may have failed." -ForegroundColor Yellow
}

# Mint an achievement NFT
Write-Host "⭐ Minting Achievement NFT..." -ForegroundColor Yellow
aptos move run --function-id "${contractAddress}::nft_rewards::mint_user_achievement" --args "u8:1" "string:First Victory Achievement" --profile=default

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Achievement NFT minted successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Achievement minting may have failed." -ForegroundColor Yellow
}

# Mint another win badge for a different market
Write-Host "🏆 Minting Win Badge for Market 5..." -ForegroundColor Yellow
aptos move run --function-id "${contractAddress}::nft_rewards::mint_user_win_badge" --args "u64:5" "string:Will Bitcoin Hit 100k" --profile=default

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Second Win Badge NFT minted successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Second Win Badge minting may have failed." -ForegroundColor Yellow
}

Write-Host "🎉 NFT Minting Complete!" -ForegroundColor Green
Write-Host "💡 You can now:" -ForegroundColor Cyan
Write-Host "   • View your NFTs in the 'NFT Collection' tab" -ForegroundColor White
Write-Host "   • List them for sale in the 'Marketplace' tab" -ForegroundColor White
Write-Host "   • See them in your wallet/collection on-chain" -ForegroundColor White
