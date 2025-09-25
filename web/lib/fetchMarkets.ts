import { aptosClient } from "./aptosClient";
import { createMockMarkets, Market } from "./types";

export const fetchMarkets = async (): Promise<Market[]> => {
  try {
    // Try to fetch from Aptos first
    const response = await aptosClient.getAllMarkets();
    
    if (response.isSuccess && response.data) {
      // Transform Aptos data to match your Market interface
      const markets: Market[] = response.data.map((aptosMarket: any) => {
        // Convert timestamp to ISO string
        const endTime = new Date(parseInt(aptosMarket.end_time) * 1000).toISOString();
        const createdAt = new Date().toISOString(); // You might want to track this in your contract
        
        return {
          claimers: [], // You might want to add this to your contract
          creator: aptosMarket.creator || '',
          createdAt,
          endTime,
          id: aptosMarket.id || '',
          liquidityInitialized: aptosMarket.liquidity_initialized || false,
          marketId: aptosMarket.id || '',
          question: aptosMarket.question || 'Unknown market',
          resolved: aptosMarket.state === 2, // Assuming state 2 means resolved
          result: aptosMarket.won, // true if yes won, false if no won, null if not resolved
          totalNo: aptosMarket.total_no || '0',
          totalYes: aptosMarket.total_yes || '0',
          totalPriceToken: aptosMarket.total_staked || '0',
          updatedAt: new Date().toISOString(),
        };
      });
      
      return markets;
    }
    
    // If Aptos API fails, return mock data
    console.warn('Aptos API failed, using mock data:', response.error);
    return createMockMarkets(3);
    
  } catch (error) {
    console.error('Error fetching markets:', error);
    // Return mock data as fallback
    return createMockMarkets(3);
  }
};
