# OmniBets on Aptos

A decentralized prediction market platform built on Aptos blockchain using Move smart contracts.

## 🏗️ Architecture

- **Smart Contracts**: Move modules for prediction markets and token management
- **Frontend**: Next.js with Aptos wallet integration
- **Blockchain**: Aptos testnet
- **Token**: MockUSDC for betting

## 📁 Project Structure

```
aptos-contracts/
├── sources/
│   ├── prediction_market.move    # Main prediction market logic
│   └── mock_usdc.move            # Mock USDC token
├── tests/                        # Move contract tests
├── Move.toml                     # Move project configuration
└── deploy.sh                     # Deployment script

web/
├── app/
│   ├── components/
│   │   ├── AptosConnectButton.tsx
│   │   ├── AptosUSDCBalance.tsx
│   │   ├── AptosBettingInterface.tsx
│   │   └── AptosCreateMarket.tsx
│   └── aptos/
│       └── page.tsx              # Main Aptos app page
└── lib/
    └── aptos-client.ts           # Aptos SDK configuration
```

## 🚀 Getting Started

### Prerequisites

1. **Aptos CLI**: Install the Aptos command-line interface
   ```bash
   curl -fsSL https://aptos.dev/scripts/install_cli.py | python3
   ```

2. **Node.js**: Version 18 or higher
   ```bash
   node --version
   ```

3. **Aptos Wallet**: Install Petra wallet or any compatible Aptos wallet

### Smart Contract Deployment

1. **Navigate to contracts directory**:
   ```bash
   cd boilerplate/aptos-contracts
   ```

2. **Initialize Aptos account**:
   ```bash
   aptos init --network testnet
   ```

3. **Fund your account**:
   ```bash
   aptos account fund-with-faucet --account default
   ```

4. **Deploy contracts**:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

5. **Update contract addresses** in `web/lib/aptos-client.ts`:
   ```typescript
   export const CONTRACT_ADDRESSES = {
     PREDICTION_MARKET: "0x[YOUR_DEPLOYED_ADDRESS]",
     MOCK_USDC: "0x[YOUR_DEPLOYED_ADDRESS]",
   };
   ```

### Frontend Setup

1. **Install dependencies**:
   ```bash
   cd web
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Visit the application**:
   ```
   http://localhost:3000/aptos
   ```

## 🎯 How to Use

### 1. Connect Wallet
- Click "Connect Wallet" button
- Select your Aptos wallet (Petra, Martian, etc.)
- Approve the connection

### 2. Create a Market
- Navigate to "Create Market" tab
- Enter your prediction question
- Set the end time
- Click "Create Market"

### 3. Initialize Liquidity
- After creating a market, initialize liquidity
- This enables betting on the market

### 4. Place Bets
- Browse active markets
- Click "View Market" on any market
- Enter the amount you want to bet
- Choose YES or NO
- Click "Buy Tokens"

### 5. Claim Rewards
- After market resolution, claim your rewards
- Winners receive their tokens automatically

## 🔧 Smart Contract Functions

### Prediction Market Module

- `create_market(question, end_time)`: Create a new prediction market
- `initialize_liquidity(market_id)`: Initialize liquidity for betting
- `buy_tokens(market_id, is_yes_token, amount)`: Buy YES or NO tokens
- `resolve_market(market_id, is_yes_won)`: Resolve a market
- `claim_rewards(market_id)`: Claim rewards after resolution

### Mock USDC Module

- `initialize()``: Initialize the MockUSDC token
- `mint(to, amount)`: Mint tokens to an address
- `balance_of(account)`: Get token balance
- `transfer(from, to, amount)`: Transfer tokens

## 🧪 Testing

### Move Contract Tests
```bash
cd boilerplate/aptos-contracts
aptos move test
```

### Frontend Testing
```bash
cd web
npm run dev
# Visit http://localhost:3000/aptos
```

## 🌐 Network Configuration

- **Testnet**: Aptos testnet (default)
- **Mainnet**: Change network in `web/lib/aptos-client.ts`

## 🔒 Security Considerations

- This is a demo implementation
- For production use, add proper access controls
- Implement proper LMSR pricing mechanism
- Add market resolution verification
- Consider using Aptos Coin instead of custom tokens

## 📚 Resources

- [Aptos Documentation](https://aptos.dev/)
- [Move Language Guide](https://move-language.github.io/move/)
- [Aptos SDK](https://github.com/aptos-labs/aptos-ts-sdk)
- [Aptos Wallet Adapter](https://github.com/aptos-labs/aptos-wallet-adapter)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
