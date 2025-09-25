import { aptosClient } from "./aptosClient";
import { createMockUserMarkets, UserMarket, createMockMarket } from "./types";

export const fetchUserMarkets = async (address: string): Promise<UserMarket[]> => {
  try {
    // Try to fetch from Aptos first
    const response = await aptosClient.getUserMarkets(address);
    
    if (response.isSuccess && response.data) {
      // Transform Aptos data to match your UserMarket interface
      const userMarkets: UserMarket[] = response.data.map((aptosUserMarket: any, index: number) => {
        const market = createMockMarket(aptosUserMarket.market_id || index.toString());
        
        // Update market with actual data if available
        if (aptosUserMarket.market) {
          market.claimers = aptosUserMarket.market.claimers || [];
          market.creator = aptosUserMarket.market.creator || '';
          market.createdAt = aptosUserMarket.market.created_at || market.createdAt;
          market.endTime = aptosUserMarket.market.end_time || market.endTime;
          market.liquidityInitialized = aptosUserMarket.market.liquidity_initialized || false;
          market.question = aptosUserMarket.market.question || market.question;
          market.resolved = aptosUserMarket.market.resolved || false;
          market.result = aptosUserMarket.market.result;
          market.totalNo = aptosUserMarket.market.total_no || '0';
          market.totalYes = aptosUserMarket.market.total_yes || '0';
          market.totalPriceToken = aptosUserMarket.market.total_price_token || '0';
          market.updatedAt = aptosUserMarket.market.updated_at || market.updatedAt;
        }
        
        return {
          id: aptosUserMarket.id || `${address}-${index}`,
          noBought: aptosUserMarket.no_bought || '0',
          noInMarket: aptosUserMarket.no_in_market || '0',
          noSold: aptosUserMarket.no_sold || '0',
          rewards: aptosUserMarket.rewards || '0',
          spent: aptosUserMarket.spent || '0',
          yesInMarket: aptosUserMarket.yes_in_market || '0',
          yesBought: aptosUserMarket.yes_bought || '0',
          yesSold: aptosUserMarket.yes_sold || '0',
          claimed: aptosUserMarket.claimed || false,
          market,
        };
      });
      
      console.log('Fetched user markets from Aptos:', userMarkets);
      return userMarkets;
    }
    
    // If Aptos API fails, return mock data
    console.warn('Aptos API failed, using mock data:', response.error);
    return createMockUserMarkets(2);
    
  } catch (error) {
    console.error('Error fetching user markets:', error);
    // Return mock data as fallback
    return createMockUserMarkets(2);
  }
};
