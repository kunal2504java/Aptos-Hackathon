# Twitter Bot Setup Guide

This guide will help you set up the Twitter bot for OmniBets to monitor mentions and hashtags, and respond to betting commands.

## Prerequisites

1. **Twitter Developer Account**: You need a Twitter Developer account
2. **Twitter App**: Create a Twitter app in the Twitter Developer Portal
3. **API Keys**: Obtain the required API keys and tokens

## Step 1: Create Twitter Developer Account

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Sign in with your Twitter account
3. Apply for a developer account if you don't have one
4. Wait for approval (usually takes a few days)

## Step 2: Create Twitter App

1. In the Twitter Developer Portal, click "Create App"
2. Fill in the app details:
   - **App Name**: `OmniBets Aptos Bot`
   - **Description**: `Prediction market bot for Aptos blockchain`
   - **Website**: Your website URL
   - **Callback URL**: `http://localhost:3000` (for development)

## Step 3: Get API Keys and Tokens

In your Twitter app settings, go to "Keys and Tokens" tab:

### App API Keys
- **API Key**: Copy this value
- **API Secret**: Copy this value

### Access Token and Secret
- **Access Token**: Copy this value
- **Access Secret**: Copy this value

### Bearer Token
- **Bearer Token**: Copy this value

## Step 4: Configure Environment Variables

Create a `.env.local` file in the `web` directory with the following variables:

```env
# Twitter API Configuration
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_SECRET=your_access_secret_here
TWITTER_BEARER_TOKEN=your_bearer_token_here

# Web App URL (for links in responses)
WEBAPP_URL=https://your-domain.com
```

## Step 5: Install Dependencies

Make sure you have the required dependencies installed:

```bash
cd web
npm install twitter-api-v2
```

## Step 6: Start the Twitter Bot

### Development Mode
```bash
cd web
node start-twitter-bot.js
```

### Production Mode
```bash
cd web
pm2 start start-twitter-bot.js --name "twitter-bot"
```

## Step 7: Test the Bot

### Test Commands
The bot responds to these Twitter commands:

1. **Mention the bot**: `@OmniBetsAptos help`
2. **Get markets**: `@OmniBetsAptos markets`
3. **Place a bet**: `@OmniBetsAptos bet 1 yes 10.5`
4. **Create market**: `@OmniBetsAptos create "Will BTC hit $100k?" 2024-12-31`

### Test via Web Interface
1. Go to `/bots` page in your web app
2. Click on "Twitter Testing" tab
3. Test various commands

## Bot Features

### Commands Supported
- `@OmniBetsAptos help` - Show available commands
- `@OmniBetsAptos markets` - List active markets
- `@OmniBetsAptos bet <market_id> <yes|no> <amount>` - Place a bet
- `@OmniBetsAptos create "question" YYYY-MM-DD` - Create a market

### Hashtags Monitored
- `#OmniBets`
- `#AptosBet`
- `#PredictionMarket`

### Automatic Announcements
- New market creation
- Market resolution
- Important updates

## Troubleshooting

### Common Issues

1. **"Rate limit exceeded"**
   - The bot has built-in rate limiting
   - Wait 5 seconds and try again

2. **"Invalid credentials"**
   - Check your API keys and tokens
   - Ensure they're correctly set in environment variables

3. **"Bot not responding"**
   - Check if the bot is running
   - Check console logs for errors
   - Verify Twitter API permissions

### Debug Mode
Enable debug logging by setting:
```env
DEBUG=twitter-bot:*
```

### Logs
Check the console output for:
- Bot startup messages
- Mention processing
- Error messages
- Rate limiting notifications

## API Permissions Required

Make sure your Twitter app has these permissions:
- **Read**: Read tweets and user information
- **Write**: Post tweets and replies
- **Direct Messages**: Send DMs (optional)

## Rate Limits

Twitter API has rate limits:
- **Search**: 300 requests per 15 minutes
- **Post Tweet**: 300 requests per 15 minutes
- **User Lookup**: 300 requests per 15 minutes

The bot includes automatic rate limiting and retry logic.

## Security Considerations

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate API keys** regularly
4. **Monitor API usage** in Twitter Developer Portal

## Production Deployment

### Using PM2
```bash
pm2 start start-twitter-bot.js --name "twitter-bot"
pm2 save
pm2 startup
```

### Using Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "start-twitter-bot.js"]
```

### Environment Variables in Production
Set these in your production environment:
- `TWITTER_API_KEY`
- `TWITTER_API_SECRET`
- `TWITTER_ACCESS_TOKEN`
- `TWITTER_ACCESS_SECRET`
- `TWITTER_BEARER_TOKEN`
- `WEBAPP_URL`

## Support

If you encounter issues:
1. Check the console logs
2. Verify API keys and permissions
3. Test with the web interface at `/bots`
4. Check Twitter API status

## Next Steps

Once the bot is running:
1. Test all commands
2. Monitor for mentions and hashtags
3. Set up automatic market announcements
4. Configure webhook endpoints (optional)
5. Add more advanced features

Happy betting! 🎯🐦
