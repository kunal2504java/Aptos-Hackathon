export interface Market {
  claimers: string[];
  creator: string;
  createdAt: string;
  endTime: string;
  id: string;
  liquidityInitialized: boolean;
  marketId: string;
  question: string;
  resolved: boolean;
  result: boolean | null;
  totalNo: string;
  totalYes: string;
  totalPriceToken: string;
  updatedAt: string;
}

export interface UserMarket {
  id: string;
  noBought: string;
  noInMarket: string;
  noSold: string;
  rewards: string;
  spent: string;
  yesInMarket: string;
  yesBought: string;
  yesSold: string;
  claimed: boolean;
  market: Market;
}

export interface MarketsResponse {
  markets: Market[];
}

export interface UserMarketsResponse {
  userMarkets: UserMarket[];
}

export interface MarketResponse {
  markets: Market[];
}

// Mock data for fallback when GraphQL is unavailable
export const createMockMarket = (id: string = "1"): Market => ({
  claimers: [],
  creator: "0x0000000000000000000000000000000000000000",
  createdAt: new Date().toISOString(),
  endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  id,
  liquidityInitialized: false,
  marketId: id,
  question: "Will this market work properly?",
  resolved: false,
  result: null,
  totalNo: "0",
  totalYes: "0",
  totalPriceToken: "0",
  updatedAt: new Date().toISOString(),
});

export const createMockMarkets = (count: number = 3): Market[] => {
  return Array.from({ length: count }, (_, i) => createMockMarket((i + 1).toString()));
};

export const createMockUserMarket = (marketId: string = "1"): UserMarket => ({
  id: `user-market-${marketId}`,
  noBought: "0",
  noInMarket: "0",
  noSold: "0",
  rewards: "0",
  spent: "0",
  yesInMarket: "0",
  yesBought: "0",
  yesSold: "0",
  claimed: false,
  market: createMockMarket(marketId),
});

export const createMockUserMarkets = (count: number = 2): UserMarket[] => {
  return Array.from({ length: count }, (_, i) => createMockUserMarket((i + 1).toString()));
};