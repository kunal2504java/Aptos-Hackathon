#!/usr/bin/env node

// Telegram Bot Launcher
// This script starts the Telegram bot in polling mode for development

const { Telegraf } = require('telegraf');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || 'http://localhost:3000';

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found in environment variables');
  console.error('Please add TELEGRAM_BOT_TOKEN to your .env.local file');
  process.exit(1);
}

console.log('🤖 Starting Telegram Bot...');
console.log(`📱 Bot Token: ${BOT_TOKEN.substring(0, 10)}...`);
console.log(`🌐 Web App URL: ${WEBAPP_URL}`);

const bot = new Telegraf(BOT_TOKEN);

// User session storage (in production, use Redis or database)
const userSessions = new Map();

// Helper function to place bet using private key
async function placeBetWithPrivateKey(
  privateKey,
  marketId,
  isYesToken,
  amount
) {
  try {
    const { Aptos, AptosConfig, Network, Ed25519PrivateKey } = await import('@aptos-labs/ts-sdk');
    
    const config = new AptosConfig({ network: Network.TESTNET });
    const aptos = new Aptos(config);
    
    // Create account from private key
    const privateKeyObj = new Ed25519PrivateKey(privateKey);
    const account = await aptos.deriveAccountFromPrivateKey({ privateKey: privateKeyObj });
    
    // Convert amount to smallest unit (6 decimals for MockUSDC)
    const amountInSmallestUnit = Math.floor(amount * Math.pow(10, 6));
    
    // Create transaction payload
    const payload = {
      type: "entry_function_payload",
      function: `${MODULE_NAMES.PREDICTION_MARKET}::buy_tokens`,
      arguments: [marketId.toString(), isYesToken, amountInSmallestUnit.toString()], // Convert to strings
      type_arguments: [],
    };
    
    // Submit transaction
    const transaction = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction: payload,
    });
    
    // Wait for transaction to be processed
    await aptos.waitForTransaction({
      transactionHash: transaction.hash,
    });
    
    return {
      success: true,
      transactionHash: transaction.hash,
    };
    
  } catch (error) {
    console.error('Error placing bet with private key:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Helper function to fetch markets
async function fetchMarkets() {
  try {
    const response = await fetch('https://fullnode.testnet.aptoslabs.com/v1/view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        function: `${MODULE_NAMES.PREDICTION_MARKET}::get_market_count`,
        type_arguments: [],
        arguments: [],
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const marketCount = await response.json();
    console.log('Market count response:', marketCount);
    
    const markets = [];
    const count = Array.isArray(marketCount) ? marketCount[0] : marketCount;
    console.log('Processing markets count:', count);
    console.log('Market count type:', typeof count);
    
    // Validate count
    if (!count || isNaN(count) || count <= 0) {
      console.log('Invalid market count, trying to fetch markets manually');
      // Try to fetch markets manually by checking if they exist
      const markets = [];
      for (let i = 1; i <= 10; i++) { // Check first 10 markets
        try {
          const marketResponse = await fetch('https://fullnode.testnet.aptoslabs.com/v1/view', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              function: `${MODULE_NAMES.PREDICTION_MARKET}::get_market`,
              type_arguments: [],
              arguments: [i.toString()],
            }),
          });
          
          if (marketResponse.ok) {
            const marketData = await marketResponse.json();
            if (marketData && marketData.length > 0) {
              markets.push({
                id: i,
                question: marketData[0] || `Market ${i}`,
                end_time: marketData[1] || 0,
                total_staked: marketData[2] || 0,
                total_yes: marketData[3] || 0,
                total_no: marketData[4] || 0,
                state: marketData[5] || 0,
                won: marketData[6] || false,
                creator: marketData[7] || '',
                yes_quantity: marketData[8] || 0,
                no_quantity: marketData[9] || 0,
                liquidity_initialized: marketData[10] || false,
              });
            }
          }
        } catch (error) {
          console.log(`Market ${i} not found, stopping search`);
          break;
        }
      }
      return markets;
    }
    
    // Fetch individual markets
    for (let i = 1; i <= parseInt(count); i++) {
      try {
        const marketResponse = await fetch('https://fullnode.testnet.aptoslabs.com/v1/view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            function: `${MODULE_NAMES.PREDICTION_MARKET}::get_market`,
            type_arguments: [],
            arguments: [i.toString()], // Convert to string
          }),
        });
        
        if (marketResponse.ok) {
          const marketData = await marketResponse.json();
          console.log(`Market ${i} raw data:`, marketData);
          
          // Handle different data structures
          let market;
          if (Array.isArray(marketData)) {
            console.log(`Market ${i} array data:`, marketData);
            market = {
              id: i,
              question: marketData[0] || `Market ${i}`,
              end_time: marketData[1] || 0,
              total_staked: marketData[2] || 0,
              total_yes: marketData[3] || 0,
              total_no: marketData[4] || 0,
              state: marketData[5] || 0,
              won: marketData[6] || false,
              creator: marketData[7] || '',
              yes_quantity: marketData[8] || 0,
              no_quantity: marketData[9] || 0,
              liquidity_initialized: marketData[10] || false,
            };
          } else if (marketData && typeof marketData === 'object') {
            // Handle object structure
            console.log(`Market ${i} object data:`, marketData);
            market = {
              id: i,
              question: marketData.question || marketData.question_text || `Market ${i}`,
              end_time: marketData.end_time || marketData.endTime || 0,
              total_staked: marketData.total_staked || marketData.totalStaked || 0,
              total_yes: marketData.total_yes || marketData.totalYes || 0,
              total_no: marketData.total_no || marketData.totalNo || 0,
              state: marketData.state || 0,
              won: marketData.won || false,
              creator: marketData.creator || '',
              yes_quantity: marketData.yes_quantity || marketData.yesQuantity || 0,
              no_quantity: marketData.no_quantity || marketData.noQuantity || 0,
              liquidity_initialized: marketData.liquidity_initialized || marketData.liquidityInitialized || false,
            };
          } else {
            console.log(`Unexpected market data format for market ${i}:`, marketData);
            continue;
          }
          
          console.log(`Created market ${i}:`, market);
          markets.push(market);
        }
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

// Helper function to call view functions using raw fetch API
async function callViewFunction(functionName, args = []) {
  try {
    // Convert all arguments to strings
    const stringArgs = args.map(arg => arg.toString());
    
    const requestBody = {
      function: functionName,
      type_arguments: [],
      arguments: stringArgs,
    };
    
    const response = await fetch('https://fullnode.testnet.aptoslabs.com/v1/view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, text: ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Raw fetch failed:', error);
    throw error;
  }
}

// Bot Commands
bot.start((ctx) => {
  console.log(`📨 /start command from user ${ctx.from.id}`);
  ctx.reply(
    `🎯 Welcome to OmniBets on Aptos!\n\n` +
    `Available commands:\n` +
    `📊 /markets - View active markets\n` +
    `🎲 /bet <market_id> <yes|no> <amount> - Place a bet\n` +
    `➕ /create <question> <end_date> - Create new market\n` +
    `💰 /balance - Check your MockUSDC balance\n` +
    `🔗 /connect - Connect your Aptos wallet\n` +
    `❓ /help - Show this help message\n\n` +
    `Example: /bet 1 yes 10.5`
  );
});

bot.command('help', (ctx) => {
  console.log(`📨 /help command from user ${ctx.from.id}`);
  ctx.reply(
    `🎯 OmniBets Commands:\n\n` +
    `📊 /markets - View all active markets\n` +
    `🎲 /bet <market_id> <yes|no> <amount> - Place a bet\n` +
    `➕ /create <question> <end_date> - Create new market\n` +
    `💰 /balance - Check MockUSDC balance\n` +
    `🔗 /connect - Connect Aptos wallet\n` +
    `🔑 /setkey <private_key> - Set private key for auto-betting\n` +
    `🗑️ /removekey - Remove stored private key\n` +
    `🔍 /debug - Show debug information\n\n` +
    `Examples:\n` +
    `• /bet 1 yes 10.5\n` +
    `• /setkey 0x1234567890abcdef...\n` +
    `• /create "Will BTC hit $100k?" "2024-12-31"\n` +
    `• /markets`
  );
});

bot.command('debug', async (ctx) => {
  console.log(`📨 /debug command from user ${ctx.from.id}`);
  try {
    const markets = await fetchMarkets();
    ctx.reply(
      `🔍 Debug Info:\n\n` +
      `Markets found: ${markets.length}\n` +
      `Raw markets data:\n\`\`\`json\n${JSON.stringify(markets, null, 2)}\n\`\`\``
    );
  } catch (error) {
    ctx.reply(`❌ Debug error: ${error.message}`);
  }
});

bot.command('markets', async (ctx) => {
  console.log(`📨 /markets command from user ${ctx.from.id}`);
  try {
    const markets = await fetchMarkets();
    
    if (markets.length === 0) {
      ctx.reply('📊 No active markets found. Create the first one with /create');
      return;
    }

    // If all markets have invalid data, create some mock markets for testing
    if (markets.every(market => !market.question || market.question.includes('Market NaN'))) {
      console.log('All markets have invalid data, creating mock markets for testing');
      markets.length = 0; // Clear the array
      for (let i = 1; i <= 3; i++) {
        markets.push({
          id: i,
          question: `Test Market ${i}`,
          end_time: Math.floor(Date.now() / 1000) + (i * 86400), // 1, 2, 3 days from now
          total_staked: 1000 * i,
          total_yes: 500 * i,
          total_no: 300 * i,
          state: 0,
          won: false,
          creator: '0x0000000000000000000000000000000000000000000000000000000000000000',
          yes_quantity: 1000 * i,
          no_quantity: 1000 * i,
          liquidity_initialized: true,
        });
      }
    }

    let message = '📊 Active Markets:\n\n';
    markets.forEach((market, index) => {
      // Handle different date formats
      let endDate;
      if (market.end_time && market.end_time > 0) {
        endDate = new Date(market.end_time * 1000).toLocaleDateString();
      } else {
        endDate = 'Unknown';
      }
      
      // Handle missing or undefined values
      const question = market.question || `Market ${market.id}`;
      const totalYes = market.total_yes || market.yes_quantity || 0;
      const totalNo = market.total_no || market.no_quantity || 0;
      const marketId = market.id || (index + 1); // Ensure ID is always a number
      
      message += `${index + 1}. ${question}\n`;
      message += `   ID: ${marketId} | Ends: ${endDate}\n`;
      message += `   YES: ${totalYes} | NO: ${totalNo}\n\n`;
    });
    
    message += 'Use /bet <market_id> <yes|no> <amount> to place a bet';
    ctx.reply(message);
  } catch (error) {
    console.error('Error fetching markets:', error);
    ctx.reply('❌ Error fetching markets. Please try again.');
  }
});

bot.command('bet', async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  console.log(`📨 /bet command from user ${ctx.from.id}: ${args.join(' ')}`);
  
  if (args.length !== 3) {
    ctx.reply(
      '❌ Invalid format. Use: /bet <market_id> <yes|no> <amount>\n' +
      'Example: /bet 1 yes 10.5'
    );
    return;
  }

  const [marketId, side, amount] = args;
  
  // Validate inputs
  if (!['yes', 'no'].includes(side.toLowerCase())) {
    ctx.reply('❌ Side must be "yes" or "no"');
    return;
  }

  const betAmount = parseFloat(amount);
  if (isNaN(betAmount) || betAmount <= 0) {
    ctx.reply('❌ Amount must be a positive number');
    return;
  }

  const userId = ctx.from.id;
  
  // Check if user has connected wallet
  if (!userSessions.has(userId)) {
    ctx.reply(
      '🔗 Please connect your Aptos wallet first!\n\n' +
      'Use the /setkey command to provide your private key:\n' +
      '`/setkey 0xYOUR_PRIVATE_KEY`\n\n' +
      '⚠️ **Security Warning**: Only use testnet private keys!'
    );
    return;
  }

  try {
    const userSession = userSessions.get(userId);
    
    // Validate market exists
    const markets = await fetchMarkets();
    const market = markets.find(m => m.id.toString() === marketId);
    
    if (!market) {
      ctx.reply(`❌ Market ${marketId} not found. Use /markets to see available markets.`);
      return;
    }

    // Check if market is still active
    const now = new Date();
    const endTime = new Date(market.end_time * 1000); // Convert Unix timestamp to Date
    if (now >= endTime) {
      ctx.reply(`❌ Market ${marketId} has already ended.`);
      return;
    }

    // Check if user has private key for automatic betting
    if (userSession?.privateKey) {
      // Place bet automatically using private key
      ctx.reply(`🎲 Placing bet automatically...\n\n📊 Market: ${market.question}\n🎯 Side: ${side.toUpperCase()}\n💰 Amount: ${betAmount} MockUSDC`);
      
      const isYesToken = side.toLowerCase() === 'yes';
      const result = await placeBetWithPrivateKey(
        userSession.privateKey,
        parseInt(marketId),
        isYesToken,
        betAmount
      );
      
      if (result.success) {
        ctx.reply(
          `✅ Bet placed successfully!\n\n` +
          `📊 Market: ${market.question}\n` +
          `🎯 Side: ${side.toUpperCase()}\n` +
          `💰 Amount: ${betAmount} MockUSDC\n` +
          `🔗 Transaction: ${result.transactionHash}\n\n` +
          `Your bet has been registered on the platform!`
        );
      } else {
        ctx.reply(
          `❌ Failed to place bet: ${result.error}\n\n` +
          `Please try again with a different amount or check your balance.`
        );
      }
    } else {
      // No private key available
      ctx.reply(
        `🎲 Ready to place bet!\n\n` +
        `📊 Market: ${market.question}\n` +
        `🎯 Side: ${side.toUpperCase()}\n` +
        `💰 Amount: ${betAmount} MockUSDC\n` +
        `⏰ Market ends: ${endTime.toLocaleString()}\n\n` +
        `To place bets automatically, use:\n` +
        `\`/setkey 0xYOUR_PRIVATE_KEY\``
      );
    }

  } catch (error) {
    console.error('Error in bet command:', error);
    ctx.reply('❌ Error processing bet request. Please try again.');
  }
});

bot.command('connect', (ctx) => {
  console.log(`📨 /connect command from user ${ctx.from.id}`);
  const userId = ctx.from.id;
  
  ctx.reply(
    '🔗 Connect your Aptos wallet to start betting!\n\n' +
    'Use the /setkey command to provide your private key:\n' +
    '`/setkey 0xYOUR_PRIVATE_KEY`\n\n' +
    '⚠️ **Security Warning**: Only use testnet private keys!'
  );
});

bot.command('setkey', async (ctx) => {
  console.log(`📨 /setkey command from user ${ctx.from.id}`);
  const args = ctx.message.text.split(' ').slice(1);
  
  if (args.length !== 1) {
    ctx.reply(
      '❌ Invalid format. Use: /setkey <private_key>\n\n' +
      '⚠️ **WARNING**: This will store your private key for automatic betting.\n' +
      'Only use this if you trust this bot and understand the risks.\n\n' +
      'Example: /setkey 0x1234567890abcdef...'
    );
    return;
  }

  const privateKey = args[0];
  const userId = ctx.from.id;
  
  // Basic validation of private key format
  if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
    ctx.reply('❌ Invalid private key format. Private key should start with 0x and be 64 characters long.');
    return;
  }

  try {
    // Test the private key by creating an account
    const { Aptos, AptosConfig, Network, Ed25519PrivateKey } = await import('@aptos-labs/ts-sdk');
    
    const config = new AptosConfig({ network: Network.TESTNET });
    const aptos = new Aptos(config);
    
    const privateKeyObj = new Ed25519PrivateKey(privateKey);
    const account = await aptos.deriveAccountFromPrivateKey({ privateKey: privateKeyObj });
    
    // Store the private key in user session
    userSessions.set(userId, {
      address: account.accountAddress.toString(),
      privateKey: privateKey,
      connectedAt: new Date(),
    });
    
    ctx.reply(
      `✅ Private key set successfully!\n\n` +
      `🔑 Address: ${account.accountAddress.toString()}\n` +
      `🎯 You can now place bets automatically using /bet command\n\n` +
      `⚠️ **Security Note**: Your private key is stored in memory only.\n` +
      `Use /removekey to clear it when done.`
    );
    
  } catch (error) {
    ctx.reply('❌ Invalid private key. Please check and try again.');
  }
});

bot.command('removekey', async (ctx) => {
  console.log(`📨 /removekey command from user ${ctx.from.id}`);
  const userId = ctx.from.id;
  
  if (userSessions.has(userId)) {
    const session = userSessions.get(userId);
    if (session?.privateKey) {
      // Remove private key but keep address
      userSessions.set(userId, {
        address: session.address,
        connectedAt: session.connectedAt,
      });
      
      ctx.reply('✅ Private key removed successfully! You can still use manual betting.');
    } else {
      ctx.reply('ℹ️ No private key was stored.');
    }
  } else {
    ctx.reply('ℹ️ No wallet connected.');
  }
});

bot.command('webapp', (ctx) => {
  console.log(`📨 /webapp command from user ${ctx.from.id}`);
  ctx.reply(
    '📱 Open OmniBets Web App',
    {
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🌐 Open Web App',
            url: `${WEBAPP_URL}/aptos`
          }
        ]]
      }
    }
  );
});

// Helper functions
async function fetchMarkets() {
  try {
    const countResponse = await callViewFunction('0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23::prediction_market::get_market_count', []);
    const marketCount = Number(countResponse[0]);
    
    const markets = [];
    const maxMarkets = Math.min(marketCount, 5); // Limit to first 5 markets
    
    for (let i = 1; i <= maxMarkets; i++) {
      const marketResponse = await callViewFunction('0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23::prediction_market::get_market', [i]);
      
      markets.push({
        id: Number(marketResponse[0]),
        question: marketResponse[1],
        end_time: Number(marketResponse[2]),
        total_staked: Number(marketResponse[3]),
        total_yes: Number(marketResponse[4]),
        total_no: Number(marketResponse[5]),
        state: Number(marketResponse[6]),
        won: marketResponse[7],
        creator: marketResponse[8],
        yes_quantity: Number(marketResponse[9]),
        no_quantity: Number(marketResponse[10]),
        liquidity_initialized: marketResponse[11],
      });
      
      // Add delay to avoid rate limiting
      if (i < maxMarkets) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return markets;
  } catch (error) {
    console.error('Error fetching markets:', error);
    return [];
  }
}

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('❌ An error occurred. Please try again.');
});

// Start the bot
console.log('🚀 Launching bot in polling mode...');
bot.launch()
  .then(() => {
    console.log('✅ Telegram bot is running!');
    console.log('📱 Find your bot: @OmniBetsAptosBot');
    console.log('🛑 Press Ctrl+C to stop the bot');
  })
  .catch((error) => {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  });

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
