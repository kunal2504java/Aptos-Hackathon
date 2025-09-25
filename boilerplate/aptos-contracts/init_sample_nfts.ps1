# Initialize Sample NFTs for Testing
# This script creates sample NFTs to test the marketplace

Write-Host "Initializing sample NFTs for marketplace testing..." -ForegroundColor Green

# Initialize marketplace if not already done
Write-Host "Initializing marketplace..." -ForegroundColor Yellow
aptos move run --function-id 0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23::nft_rewards::initialize_marketplace

# Initialize user NFT collection
Write-Host "Initializing user NFT collection..." -ForegroundColor Yellow
aptos move run --function-id 0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23::nft_rewards::initialize_user_nft_collection

# Mint sample NFTs with different rarities
Write-Host "Minting sample NFTs..." -ForegroundColor Yellow

# Common NFT (rarity 1)
aptos move run --function-id 0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23::nft_rewards::mint_nft_to_collection --args u8:1 string:"Common Win Badge" string:"A common victory badge" u8:1 string:"market1"

# Rare NFT (rarity 2)  
aptos move run --function-id 0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23::nft_rewards::mint_nft_to_collection --args u8:1 string:"Rare Achievement" string:"A rare achievement badge" u8:2 string:"achievement2"

# Legendary NFT (rarity 4)
aptos move run --function-id 0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23::nft_rewards::mint_nft_to_collection --args u8:2 string:"Legendary Streak" string:"A legendary streak badge" u8:4 string:"streak10"

Write-Host "Sample NFTs minted successfully!" -ForegroundColor Green
Write-Host "You can now check the marketplace in your app." -ForegroundColor Cyan
