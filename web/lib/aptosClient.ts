export interface AptosResponse<T> {
  data: T | null;
  error: string | null;
  isSuccess: boolean;
}

export class AptosClient {
  private contractAddress: string;
  private apiUrl: string;

  constructor(
    apiUrl: string = "https://api.testnet.aptoslabs.com/v1",
    contractAddress: string = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ""
  ) {
    this.apiUrl = apiUrl;
    this.contractAddress = contractAddress;
  }

  async getResource(resourceType: string): Promise<AptosResponse<any>> {
    try {
      if (!this.contractAddress) {
        return {
          data: null,
          error: "Contract address not configured",
          isSuccess: false,
        };
      }

      const response = await fetch(
        `${this.apiUrl}/accounts/${this.contractAddress}/resource/${resourceType}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        data: data.data,
        error: null,
        isSuccess: true,
      };
    } catch (error) {
      console.error("Error fetching resource:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        isSuccess: false,
      };
    }
  }

  async getAccountResources(address: string): Promise<AptosResponse<any[]>> {
    try {
      const response = await fetch(`${this.apiUrl}/accounts/${address}/resources`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        data: data,
        error: null,
        isSuccess: true,
      };
    } catch (error) {
      console.error("Error fetching account resources:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        isSuccess: false,
      };
    }
  }

  async getEvents(
    eventType: string,
    limit: number = 100
  ): Promise<AptosResponse<any[]>> {
    try {
      if (!this.contractAddress) {
        return {
          data: null,
          error: "Contract address not configured",
          isSuccess: false,
        };
      }

      const events = await this.aptos.getEvents({
        options: {
          limit,
        },
      });

      // Filter events by type if needed
      const filteredEvents = events.filter((event) =>
        event.type.includes(eventType)
      );

      return {
        data: filteredEvents,
        error: null,
        isSuccess: true,
      };
    } catch (error) {
      console.error("Error fetching events:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        isSuccess: false,
      };
    }
  }

  async getMarketEvents(): Promise<AptosResponse<any[]>> {
    return this.getEvents("MarketCreated");
  }

  async getTransactionsByVersion(
    startVersion: number,
    limit: number = 100
  ): Promise<AptosResponse<any[]>> {
    try {
      const transactions = await this.aptos.getTransactions({
        options: {
          start: startVersion,
          limit,
        },
      });

      return {
        data: transactions,
        error: null,
        isSuccess: true,
      };
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        isSuccess: false,
      };
    }
  }

  async viewFunction(
    functionName: string,
    functionArguments: any[] = []
  ): Promise<AptosResponse<any>> {
    try {
      if (!this.contractAddress) {
        return {
          data: null,
          error: "Contract address not configured",
          isSuccess: false,
        };
      }

      const result = await this.aptos.view({
        payload: {
          function: `${this.contractAddress}::prediction_market::${functionName}`,
          functionArguments,
        },
      });

      return {
        data: result,
        error: null,
        isSuccess: true,
      };
    } catch (error) {
      console.error(`Error calling view function ${functionName}:`, error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        isSuccess: false,
      };
    }
  }

  async getAllMarkets(): Promise<AptosResponse<any[]>> {
    try {
      const resourceType = `${this.contractAddress}::prediction_market::MarketManager`;
      const response = await this.getResource(resourceType);
      
      if (!response.isSuccess) {
        return response as AptosResponse<any[]>;
      }
      
      return {
        data: response.data?.markets || [],
        error: null,
        isSuccess: true,
      };
    } catch (error) {
      console.error("Error fetching all markets:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        isSuccess: false,
      };
    }
  }

  async getMarket(marketId: string): Promise<AptosResponse<any>> {
    try {
      const marketsResponse = await this.getAllMarkets();
      if (!marketsResponse.isSuccess || !marketsResponse.data) {
        return {
          data: null,
          error: marketsResponse.error || "Failed to fetch markets",
          isSuccess: false,
        };
      }

      const market = marketsResponse.data.find((m: any) => m.id === marketId);
      return {
        data: market || null,
        error: market ? null : "Market not found",
        isSuccess: !!market,
      };
    } catch (error) {
      console.error("Error fetching market:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        isSuccess: false,
      };
    }
  }

  async getUserMarkets(userAddress: string): Promise<AptosResponse<any[]>> {
    try {
      // Try to get user position resource
      const userResource = await this.aptos.getAccountResource({
        accountAddress: userAddress,
        resourceType: `${this.contractAddress}::prediction_market::UserPosition`,
      });

      const userData = userResource.data as any;
      return {
        data: userData.positions || [],
        error: null,
        isSuccess: true,
      };
    } catch (error) {
      console.error("Error fetching user markets:", error);
      // User might not have any positions yet, return empty array
      return {
        data: [],
        error: null,
        isSuccess: true,
      };
    }
  }

  async getMarketCount(): Promise<AptosResponse<number>> {
    try {
      const resourceType = `${this.contractAddress}::prediction_market::MarketManager`;
      const response = await this.getResource(resourceType);
      
      if (!response.isSuccess) {
        return response as AptosResponse<number>;
      }
      
      return {
        data: parseInt(response.data?.market_count || "0"),
        error: null,
        isSuccess: true,
      };
    } catch (error) {
      console.error("Error fetching market count:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        isSuccess: false,
      };
    }
  }
}

// Create a default client instance
export const aptosClient = new AptosClient();