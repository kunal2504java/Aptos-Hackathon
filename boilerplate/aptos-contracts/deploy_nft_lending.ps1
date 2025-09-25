# Deploy NFT Rewards Contract with Lending System (PowerShell)
Write-Host "Deploying NFT Rewards Contract with Lending System..." -ForegroundColor Green

# Navigate to contracts directory
Set-Location $PSScriptRoot

# Deploy the contract
Write-Host "Publishing NFT rewards contract..." -ForegroundColor Yellow
aptos move publish --profile default

if ($LASTEXITCODE -eq 0) {
    Write-Host "Contract deployed successfully!" -ForegroundColor Green
    
    # Get the deployed address from Move.toml
    $moveTomlContent = Get-Content "Move.toml" -Raw
    if ($moveTomlContent -match 'omnibets = "([^"]+)"') {
        $deployedAddress = $matches[1]
        Write-Host "Deployed address: $deployedAddress" -ForegroundColor Cyan
        
        # Initialize the NFT rewards system
        Write-Host "Initializing NFT rewards system..." -ForegroundColor Yellow
        aptos move run `
            --function-id "$deployedAddress::nft_rewards::initialize" `
            --args string:"OmniBets NFT Collection" string:"Prediction market victory badges and achievements" string:"https://omnibets.com/nft-collection" u64:10000 `
            --profile default
        
        # Initialize marketplace
        Write-Host "Initializing marketplace..." -ForegroundColor Yellow
        aptos move run `
            --function-id "$deployedAddress::nft_rewards::initialize_marketplace" `
            --profile default
        
        # Initialize lending pool
        Write-Host "Initializing lending pool..." -ForegroundColor Yellow
        aptos move run `
            --function-id "$deployedAddress::nft_rewards::initialize_lending_pool" `
            --profile default
        
        Write-Host "NFT Lending System deployment complete!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Update contract address in web/lib/aptos-client.ts to: $deployedAddress"
        Write-Host "2. Test NFT lending functionality"
        Write-Host "3. Mint some test NFTs for testing"
        
    } else {
        Write-Host "Could not find deployed address in Move.toml" -ForegroundColor Red
    }
    
} else {
    Write-Host "Contract deployment failed!" -ForegroundColor Red
    exit 1
}
