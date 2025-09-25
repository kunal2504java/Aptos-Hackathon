# Telegram Bot Testing Guide

## How to Test Automatic Bet Placement

### Step 1: Start the Bot
```bash
cd web
node start-bot.js
```

### Step 2: Connect to the Bot
1. Open Telegram and search for your bot (username: `OmniBetsAptosBot`)
2. Send `/start` to begin

### Step 3: Set Your Private Key
Send the command:
```
/setkey 0xYOUR_PRIVATE_KEY_HERE
```

**Important**: Replace `0xYOUR_PRIVATE_KEY_HERE` with your actual private key from your Aptos wallet.

### Step 4: Check Available Markets
Send:
```
/markets
```

### Step 5: Place an Automatic Bet
Send:
```
/bet 1 yes 1.0
```

This will:
- Automatically place a bet of 1.0 MockUSDC on market 1
- Choose "YES" side
- Submit the transaction to the blockchain
- Show you the transaction hash

### Step 6: Verify the Bet
1. Check the transaction hash on Aptos Explorer
2. Visit the web app to see your bet reflected in the market

## Commands Available

- `/start` - Welcome message
- `/help` - Show all commands
- `/markets` - List all markets
- `/bet <market_id> <yes|no> <amount>` - Place a bet
- `/setkey <private_key>` - Set private key for auto-betting
- `/removekey` - Remove stored private key
- `/balance` - Check MockUSDC balance
- `/create <question> <end_date>` - Create new market

## Security Notes

⚠️ **Important**: 
- Private keys are stored in memory only
- Use `/removekey` when done testing
- Only use testnet private keys
- Never share your private key with anyone

## Troubleshooting

1. **"No wallet connected"** - Use `/setkey` to provide your private key
2. **"Market not found"** - Use `/markets` to see available markets
3. **"Market has ended"** - Choose a different market
4. **"Insufficient balance"** - Get MockUSDC tokens first

## Example Session

```
User: /start
Bot: 🎯 Welcome to OmniBets on Aptos!...

User: /setkey 0x1234567890abcdef...
Bot: ✅ Private key set successfully!...

User: /markets
Bot: 📊 Active Markets:...

User: /bet 1 yes 1.0
Bot: 🎲 Placing bet automatically...
Bot: ✅ Bet placed successfully! Transaction: 0x...
```
