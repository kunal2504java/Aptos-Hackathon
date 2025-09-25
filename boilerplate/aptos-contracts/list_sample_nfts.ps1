# List Sample NFTs for Sale
# This script lists the minted NFTs in the marketplace

Write-Host "Listing sample NFTs for sale..." -ForegroundColor Green

# List Common NFT for 15 MUSDC
Write-Host "Listing Common Win Badge for 15 MUSDC..." -ForegroundColor Yellow
aptos move run --function-id 0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23::nft_rewards::list_nft_for_sale --args string:"nft_5" u64:15000000 string:"MUSDC"

# List Rare NFT for 25 MUSDC
Write-Host "Listing Rare Achievement for 25 MUSDC..." -ForegroundColor Yellow
aptos move run --function-id 0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23::nft_rewards::list_nft_for_sale --args string:"nft_6" u64:25000000 string:"MUSDC"

# List Legendary NFT for 50 MUSDC
Write-Host "Listing Legendary Streak for 50 MUSDC..." -ForegroundColor Yellow
aptos move run --function-id 0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23::nft_rewards::list_nft_for_sale --args string:"nft_7" u64:50000000 string:"MUSDC"

Write-Host "Sample NFTs listed for sale successfully!" -ForegroundColor Green
Write-Host "You can now see them in the Browse tab of your marketplace." -ForegroundColor Cyan
