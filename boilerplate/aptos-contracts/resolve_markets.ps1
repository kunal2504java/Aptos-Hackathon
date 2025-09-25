# Resolve all markets with YES option

$CONTRACT_ADDRESS = "0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23"
$MARKET_COUNT = 13

Write-Host "🏆 Resolving all $MARKET_COUNT markets with YES option..." -ForegroundColor Green

for ($i = 1; $i -le $MARKET_COUNT; $i++) {
    Write-Host "Resolving market $i..." -ForegroundColor Yellow
    
    try {
        aptos move run `
            --function-id "$CONTRACT_ADDRESS::prediction_market::resolve_market_entry" `
            --args "u64:$i" "bool:true" `
            --profile default
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Market $i resolved successfully!" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Market $i may already be resolved or ended" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Failed to resolve market $i" -ForegroundColor Red
    }
    
    # Small delay to avoid overwhelming the network
    Start-Sleep -Milliseconds 500
}

Write-Host "🎉 All markets resolution completed!" -ForegroundColor Green
