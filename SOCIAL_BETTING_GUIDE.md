# Social Betting Integration Guide

This guide explains how to set up and use the Telegram and Twitter betting features for OmniBets on Aptos.

## 🎯 Features Overview

### **Telegram Bot**
- Create bets via Telegram commands
- Real-time notifications
- Wallet connection through deep links
- Market creation and management

### **Twitter Integration**
- Create bets via tweets with hashtags
- Mention @OmniBetsAptos for commands
- Social sharing of bet results
- Automated market announcements

## 🚀 Setup Instructions

### **1. Telegram Bot Setup**

#### **Step 1: Create Telegram Bot**
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` command
3. Follow instructions to create your bot
4. Save the bot token

#### **Step 2: Configure Environment Variables**
Add to your `.env.local` file:
```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
WEBAPP_URL=https://your-domain.com

# Optional: Set webhook URL for production
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram/webhook
```

#### **Step 3: Start the Bot**
```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# In production, set webhook
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-domain.com/api/telegram/webhook"}'
```

### **2. Twitter Integration Setup**

#### **Step 1: Create Twitter App**
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Generate API keys and tokens
4. Enable OAuth 2.0

#### **Step 2: Configure Environment Variables**
Add to your `.env.local` file:
```bash
# Twitter API Configuration
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_SECRET=your_access_secret_here
TWITTER_BEARER_TOKEN=your_bearer_token_here
```

#### **Step 3: Set Up Webhook (Optional)**
For real-time Twitter integration:
```bash
# Set up Twitter webhook
curl -X POST "https://api.twitter.com/1.1/account_activity/webhooks.json" \
     -H "Authorization: Bearer YOUR_BEARER_TOKEN" \
     -d "url=https://your-domain.com/api/twitter/webhook"
```

## 📱 How to Use

### **Telegram Commands**

#### **Basic Commands**
- `/start` - Welcome message and help
- `/help` - Show all available commands
- `/markets` - List active markets
- `/balance` - Check MockUSDC balance
- `/connect` - Connect Aptos wallet
- `/webapp` - Open web interface

#### **Betting Commands**
- `/bet <market_id> <yes|no> <amount>` - Place a bet
- `/create <question> <end_date>` - Create new market

#### **Examples**
```
/bet 1 yes 10.5
/bet 2 no 25.0
/create "Will BTC hit $100k?" "2024-12-31"
```

### **Twitter Commands**

#### **Mention Commands**
Tweet to `@OmniBetsAptos` with:
- `bet 1 yes 10.5` - Place a bet
- `create "Will BTC hit $100k?" 2024-12-31` - Create market
- `markets` - List active markets
- `help` - Show commands

#### **Hashtag Integration**
Use these hashtags in your tweets:
- `#OmniBets`
- `#AptosBet`
- `#PredictionMarket`

#### **Examples**
```
@OmniBetsAptos bet 1 yes 10.5 #OmniBets
@OmniBetsAptos create "Will ETH reach $5000?" 2024-12-31
@OmniBetsAptos markets
```

## 🔧 Technical Implementation

### **Architecture**
```
User (Telegram/Twitter) 
    ↓
Bot/API (Processes Commands)
    ↓
Web App (Wallet Connection)
    ↓
Aptos Blockchain (Smart Contracts)
```

### **Key Components**

#### **1. Telegram Bot (`lib/telegram-bot.ts`)**
- Command processing
- User session management
- Deep link generation
- Notification system

#### **2. Twitter Bot (`lib/twitter-bot.ts`)**
- Tweet monitoring
- Command parsing
- Hashtag tracking
- Social announcements

#### **3. Wallet Connector (`app/telegram/page.tsx`)**
- Secure wallet connection
- Transaction signing
- Cross-platform integration

#### **4. API Endpoints**
- `/api/telegram/webhook` - Telegram webhook
- `/api/telegram/notify` - Send notifications
- `/api/twitter/webhook` - Twitter webhook

## 🛡️ Security Considerations

### **Wallet Security**
- Users must connect their own wallets
- No private key storage
- All transactions require user signature

### **Bot Security**
- Rate limiting on commands
- Input validation
- Error handling
- User session management

### **API Security**
- Webhook verification
- Environment variable protection
- Error logging

## 📊 Monitoring and Analytics

### **Telegram Metrics**
- Command usage statistics
- User engagement
- Bet success rates
- Market creation frequency

### **Twitter Metrics**
- Mention tracking
- Hashtag performance
- Social engagement
- Viral market creation

## 🚀 Deployment

### **Production Setup**
1. **Deploy Smart Contracts** to Aptos mainnet
2. **Deploy Web App** to Vercel/Netlify
3. **Set Up Bots** with production tokens
4. **Configure Webhooks** for real-time updates
5. **Monitor Performance** and user engagement

### **Environment Variables**
```bash
# Production Environment
NODE_ENV=production
WEBAPP_URL=https://omnibets-aptos.vercel.app
TELEGRAM_BOT_TOKEN=prod_bot_token
TWITTER_API_KEY=prod_api_key
# ... other production variables
```

## 🎉 Benefits

### **For Users**
- **Convenience**: Bet from anywhere via social media
- **Social**: Share bets and results with friends
- **Accessibility**: No need to visit website for simple bets
- **Notifications**: Real-time updates on market changes

### **For Platform**
- **Viral Growth**: Social sharing increases user acquisition
- **Engagement**: Multiple touchpoints keep users active
- **Accessibility**: Lower barrier to entry for new users
- **Community**: Build engaged community around predictions

## 🔮 Future Enhancements

### **Advanced Features**
- **Group Betting**: Create betting pools via Telegram groups
- **Social Leaderboards**: Track top predictors across platforms
- **Automated Strategies**: Set up recurring bets
- **Cross-Platform Sync**: Unified experience across all channels

### **Integration Ideas**
- **Discord Bot**: Gaming community integration
- **Reddit Bot**: Subreddit-specific markets
- **WhatsApp**: Emerging market penetration
- **Slack**: Corporate prediction markets

## 📞 Support

For issues or questions:
- **Telegram**: Message your bot for help
- **Twitter**: Tweet @OmniBetsAptos
- **Web**: Visit the help section in the web app
- **GitHub**: Open an issue in the repository

---

**Happy Betting! 🎯**
