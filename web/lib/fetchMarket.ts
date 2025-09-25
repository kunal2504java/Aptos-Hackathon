import { aptosClient } from "./aptosClient";
import { createMockMarket, Market } from "./types";

export const fetchMarket = async (marketId: string): Promise<Market | null> => {
  try {
    // Try to fetch from Aptos first
    const response = await aptosClient.getMarket(marketId);
    
    if (response.isSuccess && response.data) {
      const aptosMarket = response.data;
      
      // Transform Aptos data to match your Market interface
      const endTime = new Date(parseInt(aptosMarket.end_time) * 1000).toISOString();
      const createdAt = new Date().toISOString();
      
      const market: Market = {
        claimers: [],
        creator: aptosMarket.creator || '',
        createdAt,
        endTime,
        id: aptosMarket.id || marketId,
        liquidityInitialized: aptosMarket.liquidity_initialized || false,
        marketId: aptosMarket.id || marketId,
        question: aptosMarket.question || 'Unknown market',
        resolved: aptosMarket.state === 2,
        result: aptosMarket.won,
        totalNo: aptosMarket.total_no || '0',
        totalYes: aptosMarket.total_yes || '0',
        totalPriceToken: aptosMarket.total_staked || '0',
        updatedAt: new Date().toISOString(),
      };
      
      console.log('Fetched market from Aptos:', market);
      return market;
    }
    
    // If Aptos API fails, return mock data
    console.warn('Aptos API failed, using mock data:', response.error);
    return createMockMarket(marketId);
    
  } catch (error) {
    console.error('Error fetching market:', error);
    // Return mock data as fallback
    return createMockMarket(marketId);
  }
};
