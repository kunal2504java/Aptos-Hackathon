# GraphQL Error Fix - Migration to Aptos API

## Problem

You were getting the following GraphQL error:
```
Unhandled Runtime Error
Error: GraphQL Error (Code: 200): {"response":{"message":"Not found","status":200,"headers":{}},"request":{"query":"..."}}
```

## Root Cause

The issue was that your application was trying to use **The Graph Protocol** (which only supports Ethereum-compatible chains) while your project is built for **Aptos testnet**. The Graph Protocol doesn't support Aptos networks, causing the "Not found" error.

## Solution

I've migrated your data fetching from GraphQL to the **Aptos API**. Here's what was changed:

### 1. Created Aptos API Client (`lib/aptosClient.ts`)
- Replaces GraphQL with native Aptos API calls
- Includes error handling and retry logic
- Supports view functions, events, and resource queries

### 2. Updated Data Fetching Functions
- `fetchMarkets.ts` - Now uses Aptos API with fallback to mock data
- `fetchMarket.ts` - Queries individual markets via Aptos view functions
- `fetchUserMarkets.ts` - Fetches user-specific market data

### 3. Added TypeScript Types (`lib/types.ts`)
- Proper interfaces for Market and UserMarket data
- Mock data generators for development/fallback

### 4. Environment Configuration
- Updated `.env.local` with Aptos-specific variables
- Added `.env.example` template

## Setup Instructions

### 1. Configure Environment Variables

Update your `.env.local` file with your contract address:

```bash
# Aptos Configuration
NEXT_PUBLIC_APTOS_NETWORK=testnet
NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address_here
NEXT_PUBLIC_ENABLE_FALLBACK=true
```

### 2. Deploy Your Contract to Aptos

If you haven't deployed your contract yet:

```bash
# In your Move project directory
aptos move publish --named-addresses omnibet=your_account_address
```

### 3. Update Contract Address

After deployment, update the `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env.local` with your deployed contract address.

### 4. Verify the Fix

```bash
npm run dev
```

Your application should now:
- ✅ Not crash with GraphQL errors
- ✅ Show mock data when contract isn't available
- ✅ Successfully fetch real data once contract is deployed

## Important Notes

### Mock Data Fallback
The application now includes a robust fallback system:
- If contract isn't deployed → Shows mock data
- If contract address not configured → Shows mock data  
- If Aptos API fails → Shows mock data

This ensures your application never crashes due to data fetching issues.

### Contract Functions Expected
Your Aptos contract should implement these view functions:
- `get_all_markets()` - Returns array of all markets
- `get_market(market_id: string)` - Returns specific market data
- `get_user_markets(user_address: string)` - Returns user's market participation
- `get_market_count()` - Returns total number of markets

### Testing Without Contract
Since fallback is enabled, you can test your UI immediately with mock data, even before deploying your contract.

## Next Steps

1. **Deploy your Move contract to Aptos testnet**
2. **Update the `NEXT_PUBLIC_CONTRACT_ADDRESS` environment variable**
3. **Implement the required view functions in your Move contract**
4. **Test with real data once contract is live**

## Troubleshooting

If you still see errors:
1. Check that `NEXT_PUBLIC_CONTRACT_ADDRESS` is set correctly
2. Verify your contract is deployed to the specified network
3. Ensure your contract implements the expected view functions
4. Check browser console for detailed error messages

The fallback system should prevent crashes, but check console logs for debugging information.