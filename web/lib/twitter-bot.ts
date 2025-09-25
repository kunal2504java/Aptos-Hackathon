import { TwitterApi } from 'twitter-api-v2';
import { MODULE_NAMES } from './aptos-client';

// Twitter API Configuration
const TWITTER_API_KEY = process.env.TWITTER_API_KEY || '';
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET || '';
const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN || '';
const TWITTER_ACCESS_SECRET = process.env.TWITTER_ACCESS_SECRET || '';
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN || '';

// Twitter OAuth Configuration (New)
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID || '';
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET || '';

const twitterClient = new TwitterApi({
  appKey: TWITTER_API_KEY,
  appSecret: TWITTER_API_SECRET,
  accessToken: TWITTER_ACCESS_TOKEN,
  accessSecret: TWITTER_ACCESS_SECRET,
});

const twitterBearer = new TwitterApi(TWITTER_BEARER_TOKEN);

// OAuth 2.0 Client for user authentication
const twitterOAuth2 = new TwitterApi({
  clientId: TWITTER_CLIENT_ID,
  clientSecret: TWITTER_CLIENT_SECRET,
});

// Helper function to call view functions using raw fetch API with rate limiting
async function callViewFunction(functionName: string, args: any[] = []) {
  try {
    const requestBody = {
      function: functionName,
      type_arguments: [],
      arguments: args.map(arg => arg.toString()), // Convert all arguments to strings
    };
    
    const response = await fetch('https://fullnode.testnet.aptoslabs.com/v1/view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer aptoslabs_eJJWS8wiFGb_Ae2G5Vzscy8XDVXB4qS9p1J6nzAupxez9',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (response.status === 429) {
      console.log("Rate limited, waiting 5 seconds...");
      await new Promise(resolve => setTimeout(resolve, 5000));
      return callViewFunction(functionName, args);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, text: ${errorText}`);
    }
    
    const responseText = await response.text();
    console.log(`Raw response for ${functionName}:`, responseText);
    
    try {
      const data = JSON.parse(responseText);
      return data;
    } catch (parseError) {
      console.error(`JSON parse error for ${functionName}:`, parseError);
      console.error(`Response text:`, responseText);
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parse error';
      throw new Error(`Invalid JSON response: ${errorMessage}`);
    }
  } catch (error) {
    console.error('Raw fetch failed:', error);
    throw error;
  }
}

// Twitter Bot Class
export class TwitterBettingBot {
  private hashtags = ['#OmniBets', '#AptosBet', '#PredictionMarket'];
  private mentionPattern = /@OmniBetsAptos/gi;
  private betPattern = /bet\s+(\d+)\s+(yes|no)\s+(\d+(?:\.\d+)?)/gi;
  private createPattern = /create\s+"([^"]+)"\s+(\d{4}-\d{2}-\d{2})/gi;

  constructor() {
    this.startMonitoring();
  }

  // Start monitoring Twitter for mentions and hashtags
  async startMonitoring() {
    console.log('🐦 Starting Twitter monitoring...');
    
    // Monitor mentions
    setInterval(async () => {
      await this.processMentions();
    }, 30000); // Check every 30 seconds

    // Monitor hashtags
    setInterval(async () => {
      await this.processHashtags();
    }, 60000); // Check every minute
  }

  // Process mentions of @OmniBetsAptos
  async processMentions() {
    try {
      const mentions = await twitterBearer.v2.search('@OmniBetsAptos', {
        max_results: 10,
        'tweet.fields': ['created_at', 'author_id', 'text'],
      });

      for (const tweet of mentions.data || []) {
        await this.processTweet(tweet);
      }
    } catch (error) {
      console.error('Error processing mentions:', error);
    }
  }

  // Process tweets with OmniBets hashtags
  async processHashtags() {
    try {
      const hashtagQuery = this.hashtags.join(' OR ');
      const tweets = await twitterBearer.v2.search(hashtagQuery, {
        max_results: 10,
        'tweet.fields': ['created_at', 'author_id', 'text'],
      });

      for (const tweet of tweets.data || []) {
        await this.processTweet(tweet);
      }
    } catch (error) {
      console.error('Error processing hashtags:', error);
    }
  }

  // Process individual tweet
  async processTweet(tweet: any) {
    const text = tweet.text.toLowerCase();
    const tweetId = tweet.id;
    const userId = tweet.author_id;

    // Check if tweet contains bet command
    const betMatch = text.match(this.betPattern);
    if (betMatch) {
      await this.handleBetCommand(tweetId, userId, betMatch[0]);
      return;
    }

    // Check if tweet contains create command
    const createMatch = text.match(this.createPattern);
    if (createMatch) {
      await this.handleCreateCommand(tweetId, userId, createMatch[0]);
      return;
    }

    // Check if tweet is asking for help
    if (text.includes('help') || text.includes('commands')) {
      await this.sendHelpResponse(tweetId, userId);
      return;
    }

    // Check if tweet is asking for markets
    if (text.includes('markets') || text.includes('list')) {
      await this.sendMarketsResponse(tweetId, userId);
      return;
    }
  }

  // Handle bet command from tweet
  async handleBetCommand(tweetId: string, userId: string, command: string) {
    try {
      const match = command.match(/bet\s+(\d+)\s+(yes|no)\s+(\d+(?:\.\d+)?)/i);
      if (!match) {
        await this.replyToTweet(tweetId, userId, 
          '❌ Invalid bet format. Use: bet <market_id> <yes|no> <amount>\n' +
          'Example: bet 1 yes 10.5'
        );
        return;
      }

      const [, marketId, side, amount] = match;
      
      // Validate market exists
      const market = await this.getMarket(parseInt(marketId));
      if (!market) {
        await this.replyToTweet(tweetId, userId, 
          `❌ Market ${marketId} not found. Use /markets to see available markets.`
        );
        return;
      }

      // Create bet URL for user to complete
      const betUrl = `${process.env.WEBAPP_URL}/telegram?action=bet&market=${marketId}&side=${side}&amount=${amount}&user=${userId}`;
      
      await this.replyToTweet(tweetId, userId, 
        `🎲 Bet Request Received!\n\n` +
        `Market: ${market.question}\n` +
        `Side: ${side.toUpperCase()}\n` +
        `Amount: ${amount} MockUSDC\n\n` +
        `Click the link below to complete your bet:\n` +
        `${betUrl}`
      );

    } catch (error) {
      console.error('Error handling bet command:', error);
      await this.replyToTweet(tweetId, userId, 
        '❌ Error processing bet request. Please try again.'
      );
    }
  }

  // Handle create market command from tweet
  async handleCreateCommand(tweetId: string, userId: string, command: string) {
    try {
      const match = command.match(/create\s+"([^"]+)"\s+(\d{4}-\d{2}-\d{2})/i);
      if (!match) {
        await this.replyToTweet(tweetId, userId, 
          '❌ Invalid create format. Use: create "question" YYYY-MM-DD\n' +
          'Example: create "Will BTC hit $100k?" 2024-12-31'
        );
        return;
      }

      const [, question, endDate] = match;
      
      // Validate end date
      const endDateObj = new Date(endDate);
      if (isNaN(endDateObj.getTime())) {
        await this.replyToTweet(tweetId, userId, 
          '❌ Invalid date format. Use YYYY-MM-DD'
        );
        return;
      }

      // Create market URL for user to complete
      const createUrl = `${process.env.WEBAPP_URL}/telegram?action=create&question=${encodeURIComponent(question)}&endDate=${endDate}&user=${userId}`;
      
      await this.replyToTweet(tweetId, userId, 
        `➕ Market Creation Request!\n\n` +
        `Question: ${question}\n` +
        `End Date: ${endDate}\n\n` +
        `Click the link below to create the market:\n` +
        `${createUrl}`
      );

    } catch (error) {
      console.error('Error handling create command:', error);
      await this.replyToTweet(tweetId, userId, 
        '❌ Error processing create request. Please try again.'
      );
    }
  }

  // Send help response
  async sendHelpResponse(tweetId: string, userId: string) {
    const helpText = 
      `🎯 OmniBets Commands:\n\n` +
      `🎲 bet <market_id> <yes|no> <amount>\n` +
      `➕ create "question" YYYY-MM-DD\n` +
      `📊 markets (or list)\n\n` +
      `Examples:\n` +
      `• bet 1 yes 10.5\n` +
      `• create "Will BTC hit $100k?" 2024-12-31\n` +
      `• markets\n\n` +
      `Visit: ${process.env.WEBAPP_URL}/aptos`;

    await this.replyToTweet(tweetId, userId, helpText);
  }

  // Send markets list response
  async sendMarketsResponse(tweetId: string, userId: string) {
    try {
      const markets = await this.getAllMarkets();
      
      if (markets.length === 0) {
        await this.replyToTweet(tweetId, userId, 
          '📊 No active markets found. Create the first one!'
        );
        return;
      }

      let message = '📊 Active Markets:\n\n';
      markets.slice(0, 3).forEach((market, index) => {
        const endDate = new Date(market.end_time * 1000).toLocaleDateString();
        message += `${index + 1}. ${market.question}\n`;
        message += `   ID: ${market.id} | Ends: ${endDate}\n`;
        message += `   YES: ${market.total_yes} | NO: ${market.total_no}\n\n`;
      });
      
      if (markets.length > 3) {
        message += `... and ${markets.length - 3} more markets\n\n`;
      }
      
      message += `Visit: ${process.env.WEBAPP_URL}/aptos`;

      await this.replyToTweet(tweetId, userId, message);
    } catch (error) {
      console.error('Error sending markets response:', error);
      await this.replyToTweet(tweetId, userId, 
        '❌ Error fetching markets. Please try again.'
      );
    }
  }

  // Reply to a tweet
  async replyToTweet(tweetId: string, userId: string, message: string) {
    try {
      await twitterClient.v2.reply(message, tweetId);
    } catch (error) {
      console.error('Error replying to tweet:', error);
    }
  }

  // Get market by ID
  async getMarket(marketId: number) {
    try {
      const response = await callViewFunction(`${MODULE_NAMES.PREDICTION_MARKET}::get_market`, [marketId]);
      
      // Handle the response structure - it might be wrapped in an array
      let marketData = response;
      if (Array.isArray(response) && response.length > 0 && Array.isArray(response[0])) {
        marketData = response[0];
      }
      
      if (!marketData || typeof marketData !== 'object') {
        console.error('Invalid market data:', marketData);
        return null;
      }
      
      return {
        id: Number(marketData.id || marketId),
        question: marketData.question || 'Unknown Market',
        end_time: Number(marketData.end_time || 0),
        total_staked: Number(marketData.total_staked || 0),
        total_yes: Number(marketData.total_yes || 0),
        total_no: Number(marketData.total_no || 0),
        state: Number(marketData.state || 0),
        won: marketData.won || false,
        creator: marketData.creator || 'Unknown',
        yes_quantity: Number(marketData.yes_quantity || 0),
        no_quantity: Number(marketData.no_quantity || 0),
        liquidity_initialized: marketData.liquidity_initialized || false,
      };
    } catch (error) {
      console.error('Error fetching market:', error);
      return null;
    }
  }

  // Get all markets
  async getAllMarkets() {
    try {
      const countResponse = await callViewFunction(`${MODULE_NAMES.PREDICTION_MARKET}::get_market_count`, []);
      
      // Handle the response structure
      let marketCount = 0;
      if (Array.isArray(countResponse) && countResponse.length > 0) {
        marketCount = Number(countResponse[0]);
      } else if (typeof countResponse === 'number') {
        marketCount = countResponse;
      }
      
      console.log(`Found ${marketCount} markets on blockchain`);
      
      const markets = [];
      // Limit to first 10 markets to avoid rate limiting
      const maxMarkets = Math.min(marketCount, 10);
      
      for (let i = 1; i <= maxMarkets; i++) {
        try {
          const market = await this.getMarket(i);
          if (market) {
            markets.push(market);
          }
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error fetching market ${i}:`, error);
        }
      }
      
      return markets;
    } catch (error) {
      console.error('Error fetching markets:', error);
      return [];
    }
  }

  // Post market creation announcement
  async announceMarketCreation(market: any) {
    try {
      const endDate = new Date(market.end_time * 1000).toLocaleDateString();
      const message = 
        `🎯 New Prediction Market Created!\n\n` +
        `"${market.question}"\n\n` +
        `Ends: ${endDate}\n` +
        `Market ID: ${market.id}\n\n` +
        `Place your bets:\n` +
        `• bet ${market.id} yes <amount>\n` +
        `• bet ${market.id} no <amount>\n\n` +
        `${process.env.WEBAPP_URL}/aptos\n\n` +
        `#OmniBets #AptosBet #PredictionMarket`;

      await twitterClient.v2.tweet(message);
    } catch (error) {
      console.error('Error announcing market creation:', error);
    }
  }

  // Post market resolution announcement
  async announceMarketResolution(market: any) {
    try {
      const endDate = new Date(market.end_time * 1000).toLocaleDateString();
      const result = market.won ? 'YES' : 'NO';
      const message = 
        `🏁 Market Resolved!\n\n` +
        `"${market.question}"\n\n` +
        `Result: ${result} WON! 🎉\n` +
        `Total Staked: ${market.total_staked} MockUSDC\n` +
        `Market ID: ${market.id}\n\n` +
        `#OmniBets #AptosBet #PredictionMarket`;

      await twitterClient.v2.tweet(message);
    } catch (error) {
      console.error('Error announcing market resolution:', error);
    }
  }
}

// Initialize Twitter bot
export const twitterBot = new TwitterBettingBot();
