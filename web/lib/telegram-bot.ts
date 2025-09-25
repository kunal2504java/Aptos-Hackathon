import { Telegraf } from 'telegraf';
import { MODULE_NAMES } from './aptos-client';

// Telegram Bot Configuration
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://your-domain.com'; // Must be HTTPS for Telegram

const bot = new Telegraf(BOT_TOKEN);

// User session storage (in production, use Redis or database)
const userSessions = new Map<number, {
  address: string;
  privateKey?: string; // Store private key for automatic transactions
  connectedAt: Date;
}>();

// Helper function to place bet using private key
async function placeBetWithPrivateKey(
  privateKey: string,
  marketId: number,
  isYesToken: boolean,
  amount: number
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
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
      type: "entry_function_payload" as const,
      function: `${MODULE_NAMES.PREDICTION_MARKET}::buy_tokens`,
      arguments: [marketId, isYesToken, amountInSmallestUnit],
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

bot.command('setkey', async (ctx) => {
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

bot.command('help', (ctx) => {
  ctx.reply(
    `🎯 OmniBets Commands:\n\n` +
    `📊 /markets - View all active markets\n` +
    `🎲 /bet <market_id> <yes|no> <amount> - Place a bet\n` +
    `➕ /create <question> <end_date> - Create new market\n` +
    `💰 /balance - Check MockUSDC balance\n` +
    `🔗 /connect - Connect Aptos wallet\n` +
    `🔑 /setkey <private_key> - Set private key for auto-betting\n` +
    `🗑️ /removekey - Remove stored private key\n\n` +
    `Examples:\n` +
    `• /bet 1 yes 10.5\n` +
    `• /setkey 0x1234567890abcdef...\n` +
    `• /create "Will BTC hit $100k?" "2024-12-31"\n` +
    `• /markets`
  );
});

bot.command('removekey', async (ctx) => {
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
      'Use the /setkey command to provide your private key:\n' +
      '`/setkey 0xYOUR_PRIVATE_KEY`\n\n' +
      '⚠️ **Security Warning**: Only use testnet private keys!'
    );
    return;
  }

  try {
    const endTimeTimestamp = Math.floor(endDate.getTime() / 1000);
    
    ctx.reply(
      `➕ Creating market...\n\n` +
      `Question: ${question}\n` +
      `End Date: ${endDate.toLocaleDateString()}\n\n` +
      `To create markets, you need to use the web interface.\n` +
      `For now, you can place bets using /bet command.`
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
      'Use the /setkey command to provide your private key:\n' +
      '`/setkey 0xYOUR_PRIVATE_KEY`\n\n' +
      '⚠️ **Security Warning**: Only use testnet private keys!'
    );
    return;
  }

  try {
    const userSession = userSessions.get(userId);
    if (!userSession) {
      ctx.reply('❌ No wallet connected. Use /connect first.');
      return;
    }
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
    'Use the /setkey command to provide your private key:\n' +
    '`/setkey 0xYOUR_PRIVATE_KEY`\n\n' +
    '⚠️ **Security Warning**: Only use testnet private keys!'
  );
});

// Webapp command removed - requires HTTPS URL

// Helper function to call view functions using raw fetch API
async function callViewFunction(functionName: string, args: any[] = []) {
  try {
    const requestBody = {
      function: functionName,
      type_arguments: [],
      arguments: args,
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

// Helper functions
async function fetchMarkets() {
  try {
    const countResponse = await callViewFunction(`${MODULE_NAMES.PREDICTION_MARKET}::get_market_count`, []);
    const marketCount = Number(countResponse[0]);
    
    const markets = [];
    const maxMarkets = Math.min(marketCount, 5); // Limit to first 5 markets
    
    for (let i = 1; i <= maxMarkets; i++) {
      const marketResponse = await callViewFunction(`${MODULE_NAMES.PREDICTION_MARKET}::get_market`, [i]);
      
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

async function fetchUserBalance(address: string) {
  try {
    const response = await callViewFunction(`${MODULE_NAMES.MOCK_USDC}::balance_of`, [address]);
    return Number(response[0]) / Math.pow(10, 6);
  } catch (error) {
    console.error('Error fetching balance:', error);
    return 0;
  }
}

// Webhook endpoint for wallet connection
export function handleWalletConnection(userId: number, address: string) {
  userSessions.set(userId, { address, connectedAt: new Date() });
}

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('❌ An error occurred. Please try again.');
});

export default bot;
