# Aptos OmniBets Contract Deployment Guide

## Prerequisites

1. **Install Aptos CLI**
   ```bash
   # Windows (PowerShell)
   irm https://aptos.dev/scripts/install_cli.py | python

   # macOS/Linux
   curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3
   ```

2. **Initialize Aptos Account**
   ```bash
   aptos init --network testnet
   ```

3. **Fund Your Account**
   ```bash
   aptos account fund-with-faucet --account default
   ```

## Deployment Steps

### 1. Navigate to Contracts Directory
```bash
cd boilerplate/aptos-contracts
```

### 2. Deploy the Contracts
```bash
# Deploy the Move package
aptos move publish --named-addresses omnibets=default --assume-yes
```

### 3. Get Your Account Address
```bash
# Get your account address
aptos account list
```

### 4. Update Frontend Configuration

After successful deployment, update the contract addresses in `web/lib/aptos-client.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  PREDICTION_MARKET: "YOUR_ACCOUNT_ADDRESS_HERE", // Replace with your actual address
  MOCK_USDC: "YOUR_ACCOUNT_ADDRESS_HERE", // Replace with your actual address
};
```

### 5. Initialize MockUSDC (Optional)

If you want to mint some MockUSDC tokens for testing:

```bash
# Mint 1000 MockUSDC tokens to your account
aptos move run --function-id YOUR_ACCOUNT_ADDRESS::mock_usdc::mint --args address:YOUR_ACCOUNT_ADDRESS u64:1000000000
```

## Troubleshooting

### Common Issues

1. **"Hex characters are invalid" Error**
   - Make sure you're using a valid Aptos address format
   - Addresses should be 64 characters long (32 bytes in hex)

2. **"Account not found" Error**
   - Make sure your account is funded with testnet APT
   - Run: `aptos account fund-with-faucet --account default`

3. **"Module not found" Error**
   - Make sure you're in the correct directory (`boilerplate/aptos-contracts`)
   - Check that `Move.toml` exists and is properly configured

### Getting Help

- Check the [Aptos CLI documentation](https://aptos.dev/cli-tools/aptos-cli-tool/)
- Visit the [Aptos Discord](https://discord.gg/aptoslabs)
- Check the [Aptos Developer Portal](https://aptos.dev/)

## Next Steps

After successful deployment:

1. Update the contract addresses in the frontend
2. Test market creation
3. Test betting functionality
4. Deploy to mainnet when ready

## Security Notes

- Never use real funds on testnet
- Always test thoroughly before mainnet deployment
- Keep your private keys secure
- Use hardware wallets for mainnet deployments
