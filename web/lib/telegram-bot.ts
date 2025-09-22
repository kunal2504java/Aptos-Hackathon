import { Telegraf } from 'telegraf';
import { aptosClient, MODULE_NAMES } from './lib/aptos-client';

// Telegram Bot Configuration
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const WEBAPP_URL = process.env.WEBAPP_URL || 'http://localhost:3000';

const bot = new Telegraf(BOT_TOKEN);

// User session storage (in production, use Redis or database)
const userSessions = new Map();

// Bot Commands
bot.start((ctx) => {
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
  ctx.reply(
    `🎯 OmniBets Commands:\n\n` +
    `📊 /markets - View all active markets\n` +
    `🎲 /bet <market_id> <yes|no> <amount> - Place a bet\n` +
    `➕ /create <question> <end_date> - Create new market\n` +
    `💰 /balance - Check MockUSDC balance\n` +
    `🔗 /connect - Connect Aptos wallet\n` +
    `📱 /webapp - Open web interface\n\n` +
    `Examples:\n` +
    `• /bet 1 yes 10.5\n` +
    `• /create "Will BTC hit $100k?" "2024-12-31"\n` +
    `• /markets`
  );
});

bot.command('markets', async (ctx) => {
  try {
    const markets = await fetchMarkets();
    
    if (markets.length === 0) {
      ctx.reply('📊 No active markets found. Create the first one with /create');
      return;
    }

    let message = '📊 Active Markets:\n\n';
    markets.forEach((market, index) => {
      const endDate = new Date(market.end_time * 1000).toLocaleDateString();
      message += `${index + 1}. ${market.question}\n`;
      message += `   ID: ${market.id} | Ends: ${endDate}\n`;
      message += `   YES: ${market.total_yes} | NO: ${market.total_no}\n\n`;
    });
    
    message += 'Use /bet <market_id> <yes|no> <amount> to place a bet';
    ctx.reply(message);
  } catch (error) {
    ctx.reply('❌ Error fetching markets. Please try again.');
  }
});

bot.command('bet', async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  
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
      'Click the button below to connect:',
      {
        reply_markup: {
          inline_keyboard: [[
            {
              text: '🔗 Connect Wallet',
              url: `${WEBAPP_URL}/aptos?connect=true&user=${userId}`
            }
          ]]
        }
      }
    );
    return;
  }

  try {
    const userSession = userSessions.get(userId);
    const isYesToken = side.toLowerCase() === 'yes';
    const amountInSmallestUnit = Math.floor(betAmount * Math.pow(10, 6));

    // Create bet transaction payload
    const payload = {
      type: "entry_function_payload",
      function: `${MODULE_NAMES.PREDICTION_MARKET}::buy_tokens`,
      arguments: [parseInt(marketId), isYesToken, amountInSmallestUnit],
      type_arguments: [],
    };

    // Send transaction for user to sign
    ctx.reply(
      `🎲 Placing bet...\n\n` +
      `Market ID: ${marketId}\n` +
      `Side: ${side.toUpperCase()}\n` +
      `Amount: ${betAmount} MockUSDC\n\n` +
      `Please sign the transaction in your wallet.`,
      {
        reply_markup: {
          inline_keyboard: [[
            {
              text: '📱 Open Wallet',
              url: `${WEBAPP_URL}/aptos?bet=true&market=${marketId}&side=${side}&amount=${betAmount}&user=${userId}`
            }
          ]]
        }
      }
    );

  } catch (error) {
    ctx.reply('❌ Error placing bet. Please try again.');
  }
});

bot.command('create', async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  
  if (args.length < 2) {
    ctx.reply(
      '❌ Invalid format. Use: /create <question> <end_date>\n' +
      'Example: /create "Will BTC hit $100k?" "2024-12-31"'
    );
    return;
  }

  const question = args.slice(0, -1).join(' ');
  const endDateStr = args[args.length - 1];
  
  // Validate end date
  const endDate = new Date(endDateStr);
  if (isNaN(endDate.getTime())) {
    ctx.reply('❌ Invalid date format. Use YYYY-MM-DD');
    return;
  }

  const userId = ctx.from.id;
  
  // Check if user has connected wallet
  if (!userSessions.has(userId)) {
    ctx.reply(
      '🔗 Please connect your Aptos wallet first!\n\n' +
      'Click the button below to connect:',
      {
        reply_markup: {
          inline_keyboard: [[
            {
              text: '🔗 Connect Wallet',
              url: `${WEBAPP_URL}/aptos?connect=true&user=${userId}`
            }
          ]]
        }
      }
    );
    return;
  }

  try {
    const endTimeTimestamp = Math.floor(endDate.getTime() / 1000);
    
    ctx.reply(
      `➕ Creating market...\n\n` +
      `Question: ${question}\n` +
      `End Date: ${endDate.toLocaleDateString()}\n\n` +
      `Please sign the transaction in your wallet.`,
      {
        reply_markup: {
          inline_keyboard: [[
            {
              text: '📱 Open Wallet',
              url: `${WEBAPP_URL}/aptos?create=true&question=${encodeURIComponent(question)}&endDate=${endDateStr}&user=${userId}`
            }
          ]]
        }
      }
    );

  } catch (error) {
    ctx.reply('❌ Error creating market. Please try again.');
  }
});

bot.command('balance', async (ctx) => {
  const userId = ctx.from.id;
  
  if (!userSessions.has(userId)) {
    ctx.reply(
      '🔗 Please connect your Aptos wallet first!\n\n' +
      'Click the button below to connect:',
      {
        reply_markup: {
          inline_keyboard: [[
            {
              text: '🔗 Connect Wallet',
              url: `${WEBAPP_URL}/aptos?connect=true&user=${userId}`
            }
          ]]
        }
      }
    );
    return;
  }

  try {
    const userSession = userSessions.get(userId);
    const balance = await fetchUserBalance(userSession.address);
    
    ctx.reply(`💰 Your MockUSDC Balance: ${balance.toFixed(2)} MUSDC`);
  } catch (error) {
    ctx.reply('❌ Error fetching balance. Please try again.');
  }
});

bot.command('connect', (ctx) => {
  const userId = ctx.from.id;
  
  ctx.reply(
    '🔗 Connect your Aptos wallet to start betting!\n\n' +
    'Click the button below to connect:',
    {
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🔗 Connect Wallet',
            url: `${WEBAPP_URL}/aptos?connect=true&user=${userId}`
          }
        ]]
      }
    }
  );
});

bot.command('webapp', (ctx) => {
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
    const countPayload = {
      function: `${MODULE_NAMES.PREDICTION_MARKET}::get_market_count`,
      arguments: [],
    };

    const countResponse = await aptosClient.view({ payload: countPayload });
    const marketCount = Number(countResponse[0]);
    
    const markets = [];
    for (let i = 1; i <= marketCount; i++) {
      const marketPayload = {
        function: `${MODULE_NAMES.PREDICTION_MARKET}::get_market`,
        arguments: [i],
      };

      const marketResponse = await aptosClient.view({ payload: marketPayload });
      
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
    }
    
    return markets;
  } catch (error) {
    console.error('Error fetching markets:', error);
    return [];
  }
}

async function fetchUserBalance(address: string) {
  try {
    const payload = {
      function: `${MODULE_NAMES.MOCK_USDC}::balance_of`,
      arguments: [address],
    };

    const response = await aptosClient.view({ payload });
    return Number(response[0]) / Math.pow(10, 6);
  } catch (error) {
    console.error('Error fetching balance:', error);
    return 0;
  }
}

// Webhook endpoint for wallet connection
export function handleWalletConnection(userId: number, address: string) {
  userSessions.set(userId, { address, connectedAt: Date.now() });
}

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('❌ An error occurred. Please try again.');
});

export default bot;
