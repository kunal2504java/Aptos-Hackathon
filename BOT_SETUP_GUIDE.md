# OmniBets Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in the `web` directory with the following variables:

### Aptos Configuration
```bash
NEXT_PUBLIC_APTOS_NETWORK=testnet
NEXT_PUBLIC_APTOS_RPC_URL=https://fullnode.testnet.aptoslabs.com
```

### Contract Addresses
```bash
# Update with your deployed contract addresses
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS=0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23
NEXT_PUBLIC_MOCK_USDC_ADDRESS=0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23
```

### Telegram Bot Configuration
```bash
# Get from @BotFather on Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram/webhook
```

### Twitter API Configuration
```bash
# Get from Twitter Developer Portal
TWITTER_API_KEY=your_twitter_api_key_here
TWITTER_API_SECRET=your_twitter_api_secret_here
TWITTER_ACCESS_TOKEN=your_twitter_access_token_here
TWITTER_ACCESS_SECRET=your_twitter_access_secret_here
TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here
```

### Web App Configuration
```bash
WEBAPP_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

## Setup Instructions

### 1. Telegram Bot Setup

1. **Create Bot:**
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Send `/newbot` command
   - Follow instructions to create your bot
   - Save the bot token

2. **Set Bot Commands:**
   ```
   /setcommands
   start - Welcome message
   help - Show help
   markets - List active markets
   bet - Place a bet
   create - Create new market
   balance - Check balance
   connect - Connect wallet
   webapp - Open web app
   ```

3. **Set Webhook (Production):**
   ```bash
   curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
        -H "Content-Type: application/json" \
        -d '{"url": "https://your-domain.com/api/telegram/webhook"}'
   ```

### 2. Twitter API Setup

1. **Create Twitter App:**
   - Go to [Twitter Developer Portal](https://developer.twitter.com/)
   - Create a new app
   - Generate API keys and tokens
   - Enable OAuth 2.0

2. **Set Up Webhook (Optional):**
   ```bash
   curl -X POST "https://api.twitter.com/1.1/account_activity/webhooks.json" \
        -H "Authorization: Bearer YOUR_BEARER_TOKEN" \
        -d "url=https://your-domain.com/api/twitter/webhook"
   ```

### 3. Testing

1. **Start Development Server:**
   ```bash
   cd web
   npm run dev
   ```

2. **Test Telegram Bot:**
   - Find your bot on Telegram
   - Send `/start` command
   - Try `/markets` to see active markets

3. **Test Twitter Integration:**
   - Tweet: `@OmniBetsAptos markets`
   - Tweet: `@OmniBetsAptos help`

## Production Deployment

### Environment Variables for Production

```bash
# Update URLs for production
WEBAPP_URL=https://your-domain.com
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram/webhook

# Add database and Redis for production
DATABASE_URL=postgresql://username:password@localhost:5432/omnibets
REDIS_URL=redis://localhost:6379
```

### Security Notes

- Never commit `.env.local` to version control
- Use strong, unique secrets for production
- Rotate API keys regularly
- Monitor bot usage and set rate limits
