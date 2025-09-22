import { TwitterApi } from 'twitter-api-v2';
import { aptosClient, MODULE_NAMES } from './aptos-client';

// Twitter API Configuration
const TWITTER_API_KEY = process.env.TWITTER_API_KEY || '';
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET || '';
const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN || '';
const TWITTER_ACCESS_SECRET = process.env.TWITTER_ACCESS_SECRET || '';
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN || '';

const twitterClient = new TwitterApi({
  appKey: TWITTER_API_KEY,
  appSecret: TWITTER_API_SECRET,
  accessToken: TWITTER_ACCESS_TOKEN,
  accessSecret: TWITTER_ACCESS_SECRET,
});

const twitterBearer = new TwitterApi(TWITTER_BEARER_TOKEN);

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
      const payload = {
        function: `${MODULE_NAMES.PREDICTION_MARKET}::get_market`,
        arguments: [marketId],
      };

      const response = await aptosClient.view({ payload });
      
      return {
        id: Number(response[0]),
        question: response[1],
        end_time: Number(response[2]),
        total_staked: Number(response[3]),
        total_yes: Number(response[4]),
        total_no: Number(response[5]),
        state: Number(response[6]),
        won: response[7],
        creator: response[8],
        yes_quantity: Number(response[9]),
        no_quantity: Number(response[10]),
        liquidity_initialized: response[11],
      };
    } catch (error) {
      console.error('Error fetching market:', error);
      return null;
    }
  }

  // Get all markets
  async getAllMarkets() {
    try {
      const countPayload = {
        function: `${MODULE_NAMES.PREDICTION_MARKET}::get_market_count`,
        arguments: [],
      };

      const countResponse = await aptosClient.view({ payload: countPayload });
      const marketCount = Number(countResponse[0]);
      
      const markets = [];
      for (let i = 1; i <= marketCount; i++) {
        const market = await this.getMarket(i);
        if (market) {
          markets.push(market);
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
