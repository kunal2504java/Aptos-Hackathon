# OmniBets: Aptos-Native Prediction Markets with AI Resolution

## 🚀 Overview

OmniBets is the **first Aptos-native prediction market** powered by **Move smart contracts** and **LMSR strategy**. Built from the ground up for the Aptos blockchain, OmniBets delivers secure, transparent, and efficient prediction markets with cutting-edge features including AI-powered market resolution, NFT gamification, and lending systems.

**🎯 Now Live on Aptos Testnet!**

## ✨ Key Features

### 🤖 **AI-Powered Market Resolution**
- **Real-time Analysis**: AI checks external data sources to determine if markets should resolve early
- **Crypto Price Integration**: Automatic Bitcoin/Ethereum price monitoring via CoinGecko API
- **Smart Question Parsing**: Extracts price targets and conditions from market questions
- **Confidence Scoring**: Provides confidence levels and evidence for resolution decisions
- **One-Click Resolution**: Instant market analysis with detailed reasoning

### 🎮 **NFT Gamification System**
- **Win Badges**: Mint unique NFTs for successful predictions
- **Achievement System**: Track win streaks and total victories
- **Dynamic NFTs**: Metadata updates based on on-chain performance
- **Rarity System**: Common, Rare, Epic, and Legendary NFT tiers
- **Visual Collection**: Beautiful NFT gallery with rarity-based styling

### 🏪 **NFT Marketplace & Trading**
- **Buy & Sell NFTs**: Trade prediction market NFTs with other users
- **Dynamic Pricing**: NFT values based on rarity and market performance
- **Real-time Listings**: Live marketplace with instant updates
- **Consistent Design**: Blue gradient backgrounds with rarity-based borders
- **Transaction Integration**: Seamless Aptos wallet integration

### 💎 **NFT Lending System**
- **Collateral Betting**: Use NFTs as collateral for prediction market bets
- **Dynamic Valuation**: NFT values calculated based on type and rarity
- **Risk Management**: Automatic liquidation if bets are lost
- **Lending Pool**: Community-driven liquidity for NFT-backed bets
- **Real-time Tracking**: Monitor active collateral and loan status

### 🔗 **Move Smart Contracts**
- **Resource-Oriented Programming**: Maximum security with Move's compile-time safety
- **Gas Efficiency**: Optimized for Aptos's high throughput and low latency
- **Modular Architecture**: Separate contracts for markets, NFTs, and lending
- **Transparent Resolution**: Immutable on-chain market outcomes

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Aptos CLI** for contract deployment
- **Petra Wallet** or compatible Aptos wallet
- **Aptos Testnet tokens** for gas fees

### 1️⃣ Clone and Install

```bash
git clone <repository-url>
cd OmniBet
cd web
npm install
```

### 2️⃣ Environment Setup

Create `.env.local` in the `web` directory:

```bash
# Aptos Configuration
APTOS_RPC_URL=https://fullnode.testnet.aptoslabs.com/v1
APTOS_API_KEY=your_api_key_here

# Bot Configuration (Optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
```

### 3️⃣ Deploy Smart Contracts

```bash
cd boilerplate/aptos-contracts

# Deploy main prediction market
bash deploy.sh

# Deploy NFT rewards system
bash deploy_nft_lending.sh

# Initialize marketplace
bash init_marketplace.ps1
```

### 4️⃣ Update Contract Addresses

Update `web/lib/aptos-client.ts` with deployed addresses:

```typescript
export const CONTRACT_ADDRESSES = {
  PREDICTION_MARKET: "0x[YOUR_DEPLOYED_ADDRESS]",
  NFT_REWARDS: "0x[YOUR_DEPLOYED_ADDRESS]",
  NFT_MARKETPLACE: "0x[YOUR_DEPLOYED_ADDRESS]",
};
```

### 5️⃣ Run the Application

```bash
cd web
npm run dev
```

Visit `http://localhost:3000` and connect your Aptos wallet!

## 🎯 How to Use

### Creating Markets
1. **Connect Wallet**: Use Petra or compatible Aptos wallet
2. **Navigate to Aptos App**: Click "🚀 Launch Aptos App"
3. **Create Market**: Go to "Create" tab and enter market details
4. **Set End Time**: Choose resolution date and time
5. **Deploy**: Market is deployed on Aptos blockchain

### Placing Bets
1. **Browse Markets**: View active prediction markets
2. **Select Market**: Click "View Market" on any active market
3. **Choose Side**: Select YES or NO outcome
4. **Enter Amount**: Specify bet amount in MockUSDC
5. **Confirm**: Sign transaction with your wallet

### AI Market Resolution
1. **Find Active Market**: Look for markets with AI resolution button
2. **Click "Check Market Resolution"**: AI analyzes current data
3. **Review Results**: See confidence level, reasoning, and evidence
4. **Early Resolution**: If AI suggests resolution, market can be resolved early

### NFT System
1. **Win Predictions**: Successful bets earn NFT rewards
2. **Mint NFTs**: Go to "Winnings" tab to mint achievement NFTs
3. **Trade NFTs**: Visit "Marketplace" to buy/sell NFTs
4. **Use as Collateral**: Go to "Lending" tab to use NFTs for betting

## 🤖 AI Resolution Examples

### Bitcoin Price Markets
```
Market: "Will Bitcoin hit 100k by January 1st?"
Current Price: $105,000
AI Result: ✅ YES (95% confidence)
Reasoning: "Bitcoin has reached $105,000, exceeding the target of $100,000."
```

### Ethereum Markets
```
Market: "Will Ethereum reach 5k by December?"
Current Price: $4,200
AI Result: ❌ NO (70% confidence)
Reasoning: "Ethereum is currently at $4,200, below the target of $5,000."
```

## 🎮 NFT System Details

### NFT Types
- **Win Badges**: Commemorate successful predictions
- **Achievement NFTs**: Track milestones and streaks
- **Dynamic NFTs**: Metadata updates based on performance

### Rarity Levels
- **Common** (Gray): Basic win badges
- **Rare** (Blue): Achievement milestones
- **Epic** (Purple): Win streaks
- **Legendary** (Yellow): Major achievements

### Marketplace Features
- **Real-time Trading**: Buy and sell NFTs instantly
- **Dynamic Pricing**: Values based on rarity and performance
- **Visual Design**: Consistent blue backgrounds with rarity borders
- **Transaction History**: Track all NFT trades

## 💎 NFT Lending System

### How It Works
1. **Select NFT**: Choose from your NFT collection
2. **Choose Market**: Pick a prediction market to bet on
3. **Set Amount**: Enter bet amount (≤ NFT value)
4. **Use Collateral**: NFT is locked as collateral
5. **Win/Lose**: NFT is returned if you win, liquidated if you lose

### Benefits
- **No Upfront Capital**: Bet without spending tokens
- **Higher Leverage**: Use NFT value for larger bets
- **Risk Management**: Automatic liquidation prevents losses
- **Community Liquidity**: Shared lending pool

## 🔧 Bot Integration

### Telegram Bot
- **Private Key Betting**: Secure betting via private keys
- **Market Commands**: `/markets`, `/bet`, `/create`
- **Real-time Updates**: Live market information
- **Wallet Integration**: Connect Aptos wallet

### Twitter Bot
- **Mention Processing**: Respond to @OmniBetsAptos mentions
- **Market Updates**: Post market information
- **Bet Commands**: Process betting commands via tweets
- **OAuth Integration**: Secure Twitter API access

## 📊 Technical Specifications

### Smart Contracts
- **Language**: Move
- **Framework**: Aptos Framework
- **Standards**: Aptos Token Standard
- **Gas Optimization**: Efficient resource usage

### Frontend
- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Wallet**: Aptos Wallet Standard
- **UI Components**: Radix UI

### APIs
- **Crypto Prices**: CoinGecko API
- **AI Resolution**: Custom AI engine
- **Bot APIs**: Telegram Bot API, Twitter API v2

## 🌐 Aptos Testnet Details

- **Chain ID**: 1 (Testnet)
- **RPC URL**: https://fullnode.testnet.aptoslabs.com/v1
- **Explorer**: https://explorer.aptoslabs.com/?network=testnet
- **Native Token**: APT
- **Faucet**: https://faucet.testnet.aptoslabs.com/

## 🎥 Demo Features

### Live Demo
- **Market Creation**: Create prediction markets in seconds
- **AI Resolution**: See AI analyze markets in real-time
- **NFT Minting**: Watch NFTs get minted for wins
- **Marketplace Trading**: Trade NFTs with other users
- **NFT Lending**: Use NFTs as collateral for bets

### Bot Demos
- **Telegram**: `/markets` to see live markets
- **Twitter**: @OmniBetsAptos mention for market info

## 🔮 Future Roadmap

### Phase 1 (Current)
- ✅ Aptos-native prediction markets
- ✅ AI-powered resolution
- ✅ NFT gamification
- ✅ Marketplace trading
- ✅ NFT lending system

### Phase 2 (Planned)
- 🔄 Stock market integration
- 🔄 Sports results API
- 🔄 News/events resolution
- 🔄 Cross-chain expansion
- 🔄 Mobile app

### Phase 3 (Future)
- 🔄 Advanced AI models
- 🔄 DeFi integrations
- 🔄 Governance tokens
- 🔄 DAO management

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines and feel free to submit issues and pull requests.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Aptos Labs** for the Move language and blockchain
- **CoinGecko** for crypto price data
- **Telegram** and **Twitter** for bot integration
- **Community** for feedback and contributions

---

**Built with ❤️ on Aptos using Move smart contracts**

*OmniBets: The future of prediction markets is here.*
