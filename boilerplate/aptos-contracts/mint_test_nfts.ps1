# Mint Test NFTs for NFT Lending Testing (PowerShell)
Write-Host "Minting test NFTs for NFT lending testing..." -ForegroundColor Green

# Set the deployed address
$deployedAddress = "0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23"

# Initialize user NFT collection first
Write-Host "Initializing user NFT collection..." -ForegroundColor Yellow
aptos move run `
    --function-id "$deployedAddress::nft_rewards::initialize_user_nft_collection" `
    --profile default

# Mint a Common Win Badge NFT
Write-Host "Minting Common Win Badge NFT..." -ForegroundColor Yellow
aptos move run `
    --function-id "$deployedAddress::nft_rewards::mint_nft_to_collection" `
    --args u8:1 string:"Test Win Badge #1" string:"A test win badge for market 1" u8:1 string:"market_1_win" `
    --profile default

# Mint a Rare Achievement NFT
Write-Host "Minting Rare Achievement NFT..." -ForegroundColor Yellow
aptos move run `
    --function-id "$deployedAddress::nft_rewards::mint_nft_to_collection" `
    --args u8:2 string:"Test Achievement #1" string:"A test achievement badge" u8:2 string:"achievement_streak" `
    --profile default

# Mint a Legendary Streak NFT
Write-Host "Minting Legendary Streak NFT..." -ForegroundColor Yellow
aptos move run `
    --function-id "$deployedAddress::nft_rewards::mint_nft_to_collection" `
    --args u8:3 string:"Test Streak #1" string:"A legendary streak badge" u8:4 string:"legendary_streak" `
    --profile default

Write-Host "Test NFTs minted successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "You now have:" -ForegroundColor Cyan
Write-Host "- 1 Common Win Badge (worth ~$1)"
Write-Host "- 1 Rare Achievement (worth ~$4)" 
Write-Host "- 1 Legendary Streak (worth ~$15)"
Write-Host ""
Write-Host "You can now test the NFT lending system!" -ForegroundColor Green
