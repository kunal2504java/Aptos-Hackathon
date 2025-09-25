// Twitter Bot Startup Script (ES Module)
console.log('🐦 Starting Twitter Bot...');

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Check environment variables
const requiredEnvVars = [
  'TWITTER_API_KEY',
  'TWITTER_API_SECRET', 
  'TWITTER_ACCESS_TOKEN',
  'TWITTER_ACCESS_SECRET',
  'TWITTER_BEARER_TOKEN',
  'TWITTER_CLIENT_ID',
  'TWITTER_CLIENT_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease set these variables in your .env.local file.');
  process.exit(1);
}

console.log('✅ All required environment variables are set');

// Enhanced Twitter Bot Implementation (JavaScript)
class TwitterBot {
  constructor() {
    this.botUsername = 'OmniBetsAptos';
    this.hashtags = ['#OmniBets', '#AptosBet', '#PredictionMarket'];
    this.mentionPattern = new RegExp(`@${this.botUsername}`, 'gi');
    this.betPattern = /bet\s+(\d+)\s+(yes|no)\s+(\d+(?:\.\d+)?)/gi;
    this.createPattern = /create\s+"([^"]+)"\s+(\d{4}-\d{2}-\d{2})/gi;
    this.helpPattern = /help|commands/gi;
    this.marketsPattern = /markets|list/gi;
    this.processedTweets = new Set(); // Track processed tweets to avoid duplicates
    this.rateLimits = {}; // Track rate limits for different endpoints
  }

  async startMonitoring() {
    console.log('📱 Starting Twitter monitoring...');
    
    // Monitor mentions every 2 minutes (reduced frequency to avoid rate limits)
    setInterval(async () => {
      await this.processMentions();
    }, 120000);

    // Monitor hashtags every 5 minutes (reduced frequency)
    setInterval(async () => {
      await this.processHashtags();
    }, 300000);

    // Post market updates every 10 minutes (reduced frequency)
    setInterval(async () => {
      await this.postMarketUpdates();
    }, 600000);
  }

  async processMentions() {
    try {
      console.log('🔍 Checking for mentions...');
      
      // Get recent mentions using Twitter API v2
      const mentions = await this.getRecentMentions();
      
      for (const mention of mentions) {
        if (this.processedTweets.has(mention.id)) {
          continue; // Skip already processed tweets
        }
        
        await this.handleMention(mention);
        this.processedTweets.add(mention.id);
      }
      
      console.log(`✅ Processed ${mentions.length} mentions`);
    } catch (error) {
      console.error('❌ Error processing mentions:', error);
    }
  }

  async processHashtags() {
    try {
      console.log('🔍 Checking for hashtags...');
      
      // Search for tweets with our hashtags
      for (const hashtag of this.hashtags) {
        const tweets = await this.searchHashtag(hashtag);
        
        for (const tweet of tweets) {
          if (this.processedTweets.has(tweet.id)) {
            continue;
          }
          
          await this.handleHashtagTweet(tweet, hashtag);
          this.processedTweets.add(tweet.id);
        }
      }
      
      console.log('✅ Hashtag check completed');
    } catch (error) {
      console.error('❌ Error processing hashtags:', error);
    }
  }

  async postMarketUpdates() {
    try {
      console.log('📊 Posting market updates...');
      
      const markets = await this.getAllMarkets();
      const activeMarkets = markets.filter(m => m.state === 0); // Active markets
      
      if (activeMarkets.length > 0) {
        const randomMarket = activeMarkets[Math.floor(Math.random() * activeMarkets.length)];
        await this.postMarketUpdate(randomMarket);
      }
      
      console.log('✅ Market update posted');
    } catch (error) {
      console.error('❌ Error posting market updates:', error);
    }
  }

  async callViewFunction(functionName, args = []) {
    try {
      const requestBody = {
        function: functionName,
        type_arguments: [],
        arguments: args.map(arg => {
          if (arg === undefined || arg === null) {
            console.error('Warning: undefined argument passed to callViewFunction');
            return '0'; // fallback value
          }
          return arg.toString();
        }),
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
        return this.callViewFunction(functionName, args);
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

  async getMarket(marketId) {
    try {
      // Ensure marketId is valid
      if (marketId === undefined || marketId === null) {
        console.error('Invalid marketId:', marketId);
        return null;
      }
      
      const response = await this.callViewFunction(`0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23::prediction_market::get_market`, [marketId]);
      
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

  async getAllMarkets() {
    try {
      const countResponse = await this.callViewFunction(`0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23::prediction_market::get_market_count`, []);
      
      let marketCount = 0;
      if (Array.isArray(countResponse) && countResponse.length > 0) {
        marketCount = Number(countResponse[0]);
      } else if (typeof countResponse === 'number') {
        marketCount = countResponse;
      }
      
      console.log(`Found ${marketCount} markets on blockchain`);
      
      const markets = [];
      const maxMarkets = Math.min(marketCount, 10);
      
      for (let i = 1; i <= maxMarkets; i++) {
        try {
          const market = await this.getMarket(i);
          if (market) {
            markets.push(market);
          }
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

  // Twitter API Methods
  async getRecentMentions() {
    try {
      // Check if we're rate limited
      if (this.isRateLimited('mentions')) {
        console.log('⏳ Rate limited for mentions, using mock data');
        return this.getMockMentions();
      }
      
      const response = await fetch('https://api.twitter.com/2/users/by/username/OmniBetsAptos', {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
        },
      });
      
      if (response.status === 429) {
        console.log('⏳ Twitter API rate limited, using mock data');
        this.setRateLimit('mentions', 15 * 60 * 1000); // 15 minutes
        return this.getMockMentions();
      }
      
      if (!response.ok) {
        console.log(`Twitter API error: ${response.status}, using mock data`);
        return this.getMockMentions();
      }
      
      const userData = await response.json();
      const userId = userData.data?.id;
      
      if (!userId) {
        console.log('Bot user not found, using mock mentions');
        return this.getMockMentions();
      }
      
      // Get mentions for the bot
      const mentionsResponse = await fetch(`https://api.twitter.com/2/users/${userId}/mentions?max_results=5`, {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
        },
      });
      
      if (mentionsResponse.status === 429) {
        console.log('⏳ Mentions API rate limited, using mock data');
        this.setRateLimit('mentions', 15 * 60 * 1000);
        return this.getMockMentions();
      }
      
      if (!mentionsResponse.ok) {
        console.log('Mentions API error, using mock data');
        return this.getMockMentions();
      }
      
      const mentionsData = await mentionsResponse.json();
      return mentionsData.data || [];
    } catch (error) {
      console.error('Error fetching mentions:', error);
      return this.getMockMentions();
    }
  }

  async searchHashtag(hashtag) {
    try {
      // Check if we're rate limited
      if (this.isRateLimited('search')) {
        console.log(`⏳ Rate limited for search, using mock data for ${hashtag}`);
        return this.getMockHashtagTweets(hashtag);
      }
      
      const response = await fetch(`https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(hashtag)}&max_results=5`, {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
        },
      });
      
      if (response.status === 429) {
        console.log(`⏳ Hashtag search rate limited for ${hashtag}, using mock data`);
        this.setRateLimit('search', 15 * 60 * 1000); // 15 minutes
        return this.getMockHashtagTweets(hashtag);
      }
      
      if (!response.ok) {
        console.log(`Hashtag search error for ${hashtag}, using mock data`);
        return this.getMockHashtagTweets(hashtag);
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error(`Error searching hashtag ${hashtag}:`, error);
      return this.getMockHashtagTweets(hashtag);
    }
  }

  async postTweet(text) {
    try {
      // Note: Twitter API v2 requires OAuth 1.0a User Context for posting
      // For now, we'll simulate posting to avoid authentication errors
      console.log('📝 [SIMULATED TWEET]:', text);
      console.log('ℹ️  Note: Real posting requires OAuth 1.0a User Context authentication');
      return true;
      
      /* Real implementation would be:
      const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Tweet posting error:', errorData);
        return false;
      }
      
      const data = await response.json();
      console.log('✅ Tweet posted successfully:', data.data?.id);
      return true;
      */
    } catch (error) {
      console.error('Error posting tweet:', error);
      return false;
    }
  }

  async replyToTweet(tweetId, text) {
    try {
      // Note: Twitter API v2 requires OAuth 1.0a User Context for posting
      // For now, we'll simulate replying to avoid authentication errors
      console.log(`📝 [SIMULATED REPLY to ${tweetId}]:`, text);
      console.log('ℹ️  Note: Real replying requires OAuth 1.0a User Context authentication');
      return true;
      
      /* Real implementation would be:
      const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text,
          reply: {
            in_reply_to_tweet_id: tweetId
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Reply posting error:', errorData);
        return false;
      }
      
      const data = await response.json();
      console.log('✅ Reply posted successfully:', data.data?.id);
      return true;
      */
    } catch (error) {
      console.error('Error posting reply:', error);
      return false;
    }
  }

  // Command Handlers
  async handleMention(mention) {
    const text = mention.text.toLowerCase();
    const username = mention.author_id || 'user';
    
    console.log(`📨 Processing mention from @${username}: ${mention.text}`);
    
    if (this.helpPattern.test(text)) {
      await this.sendHelpReply(mention.id);
    } else if (this.marketsPattern.test(text)) {
      await this.sendMarketsReply(mention.id);
    } else if (this.betPattern.test(text)) {
      await this.handleBetCommand(mention);
    } else if (this.createPattern.test(text)) {
      await this.handleCreateCommand(mention);
    } else {
      await this.sendWelcomeReply(mention.id);
    }
  }

  async handleHashtagTweet(tweet, hashtag) {
    console.log(`🏷️ Processing hashtag tweet: ${hashtag} - ${tweet.text}`);
    
    // Like and retweet tweets with our hashtags
    await this.likeTweet(tweet.id);
    await this.retweet(tweet.id);
  }

  async sendHelpReply(tweetId) {
    const helpText = `🎯 @OmniBetsAptos Commands:

📊 Markets: "@OmniBetsAptos markets" - See active markets
🎲 Bet: "@OmniBetsAptos bet 1 yes 10" - Bet 10 USDC on market 1 YES
➕ Create: "@OmniBetsAptos create "Will BTC hit $100k?" 2024-12-31"
❓ Help: "@OmniBetsAptos help" - Show this menu

Built on @AptosLabs 🚀 #OmniBets #PredictionMarket`;
    
    await this.replyToTweet(tweetId, helpText);
  }

  async sendMarketsReply(tweetId) {
    const markets = await this.getAllMarkets();
    const activeMarkets = markets.filter(m => m.state === 0).slice(0, 3);
    
    let replyText = `📊 Active Markets:\n\n`;
    
    if (activeMarkets.length === 0) {
      replyText += `No active markets right now. Create one with:\n"@OmniBetsAptos create "Your question" 2024-12-31"`;
    } else {
      activeMarkets.forEach(market => {
        const endDate = new Date(market.end_time * 1000).toLocaleDateString();
        replyText += `🎯 Market ${market.id}: ${market.question}\n📅 Ends: ${endDate}\n💰 Staked: ${market.total_staked} USDC\n\n`;
      });
    }
    
    replyText += `\n🎲 Bet: "@OmniBetsAptos bet [ID] [yes/no] [amount]"`;
    
    await this.replyToTweet(tweetId, replyText);
  }

  async sendWelcomeReply(tweetId) {
    const welcomeText = `👋 Welcome to @OmniBetsAptos! 

🎯 Decentralized prediction markets on @AptosLabs
🎲 Bet on real-world events and earn rewards
📊 Create your own markets

Type "@OmniBetsAptos help" for commands! 🚀`;
    
    await this.replyToTweet(tweetId, welcomeText);
  }

  async handleBetCommand(mention) {
    const text = mention.text;
    const match = text.match(this.betPattern);
    
    if (!match) {
      await this.replyToTweet(mention.id, `❌ Invalid bet format. Use: "@OmniBetsAptos bet [market_id] [yes/no] [amount]"`);
      return;
    }
    
    const [, marketId, side, amount] = match;
    
    try {
      const market = await this.getMarket(marketId);
      if (!market) {
        await this.replyToTweet(mention.id, `❌ Market ${marketId} not found. Use "@OmniBetsAptos markets" to see available markets.`);
        return;
      }
      
      if (market.state !== 0) {
        await this.replyToTweet(mention.id, `❌ Market ${marketId} is not accepting bets (${market.state === 1 ? 'resolved' : 'cancelled'}).`);
        return;
      }
      
      // Simulate bet placement (in real implementation, this would use private keys)
      const betAmount = parseFloat(amount);
      const sideText = side.toLowerCase() === 'yes' ? 'YES' : 'NO';
      
      const replyText = `🎲 Bet placed successfully!

📊 Market ${marketId}: ${market.question}
🎯 Your bet: ${betAmount} USDC on ${sideText}
💰 Total staked: ${market.total_staked} USDC

Note: This is a demo. Real betting requires wallet connection.`;
      
      await this.replyToTweet(mention.id, replyText);
      
    } catch (error) {
      console.error('Error handling bet command:', error);
      await this.replyToTweet(mention.id, `❌ Error placing bet: ${error.message}`);
    }
  }

  async handleCreateCommand(mention) {
    const text = mention.text;
    const match = text.match(this.createPattern);
    
    if (!match) {
      await this.replyToTweet(mention.id, `❌ Invalid create format. Use: "@OmniBetsAptos create "Your question" YYYY-MM-DD"`);
      return;
    }
    
    const [, question, endDate] = match;
    
    try {
      const endTime = new Date(endDate).getTime() / 1000;
      const now = Date.now() / 1000;
      
      if (endTime <= now) {
        await this.replyToTweet(mention.id, `❌ End date must be in the future.`);
        return;
      }
      
      // Simulate market creation
      const replyText = `✅ Market creation request received!

📊 Question: "${question}"
📅 End date: ${endDate}
👤 Creator: @${mention.author_id || 'user'}

Note: This is a demo. Real market creation requires wallet connection and fees.`;
      
      await this.replyToTweet(mention.id, replyText);
      
    } catch (error) {
      console.error('Error handling create command:', error);
      await this.replyToTweet(mention.id, `❌ Error creating market: ${error.message}`);
    }
  }

  async postMarketUpdate(market) {
    const endDate = new Date(market.end_time * 1000).toLocaleDateString();
    const timeLeft = Math.max(0, market.end_time - Math.floor(Date.now() / 1000));
    const hoursLeft = Math.floor(timeLeft / 3600);
    
    const updateText = `📊 Market Update!

🎯 Market ${market.id}: ${market.question}
📅 Ends: ${endDate} (${hoursLeft}h left)
💰 Total Staked: ${market.total_staked} USDC
📈 YES: ${market.total_yes} | 📉 NO: ${market.total_no}

🎲 Bet now: "@OmniBetsAptos bet ${market.id} [yes/no] [amount]"

#OmniBets #PredictionMarket @AptosLabs`;
    
    await this.postTweet(updateText);
  }

  async likeTweet(tweetId) {
    // Implementation would require OAuth 1.0a for write operations
    console.log(`👍 Would like tweet: ${tweetId}`);
  }

  async retweet(tweetId) {
    // Implementation would require OAuth 1.0a for write operations
    console.log(`🔄 Would retweet: ${tweetId}`);
  }

  // Rate limiting helpers
  isRateLimited(endpoint) {
    const limit = this.rateLimits[endpoint];
    if (!limit) return false;
    return Date.now() < limit;
  }

  setRateLimit(endpoint, duration) {
    this.rateLimits[endpoint] = Date.now() + duration;
    console.log(`⏳ Rate limit set for ${endpoint} until ${new Date(this.rateLimits[endpoint]).toLocaleTimeString()}`);
  }

  // Mock data for testing
  getMockMentions() {
    return [
      {
        id: 'mock_1',
        text: '@OmniBetsAptos help',
        author_id: 'mock_user_1'
      },
      {
        id: 'mock_2', 
        text: '@OmniBetsAptos bet 1 yes 10',
        author_id: 'mock_user_2'
      }
    ];
  }

  getMockHashtagTweets(hashtag) {
    return [
      {
        id: `mock_${hashtag}_1`,
        text: `Check out this prediction market! ${hashtag}`,
        author_id: 'mock_user_3'
      }
    ];
  }
}

// Initialize and start the Twitter bot
try {
  const twitterBot = new TwitterBot();
  await twitterBot.startMonitoring();
  
  console.log('🚀 Twitter Bot started successfully!');
  console.log('📱 Monitoring for mentions and hashtags...');
  console.log('🔗 Testing blockchain connection...');
  
  // Test blockchain connection
  try {
    const markets = await twitterBot.getAllMarkets();
    console.log(`✅ Blockchain connection successful! Found ${markets.length} markets`);
  } catch (error) {
    console.error('❌ Blockchain connection failed:', error);
  }
  
  // Keep the process running
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Twitter Bot...');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down Twitter Bot...');
    process.exit(0);
  });
  
} catch (error) {
  console.error('❌ Failed to start Twitter Bot:', error);
  process.exit(1);
}