"use client";

import { aptosClient, MODULE_NAMES } from "@/lib/aptos-client";
import React, { useState, useEffect } from "react";
import AptosConnectButton from "@/app/components/AptosConnectButton";
import AptosUSDCBalance from "@/app/components/AptosUSDCBalance";
import AptosBettingInterface from "@/app/components/AptosBettingInterface";
import AptosCreateMarket from "@/app/components/AptosCreateMarket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

interface Market {
  id: number;
  question: string;
  end_time: number;
  total_staked: number;
  total_yes: number;
  total_no: number;
  state: number;
  won: boolean;
  creator: string;
  yes_quantity: number;
  no_quantity: number;
  liquidity_initialized: boolean;
}

interface AptosWallet {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  account(): { address: string } | null;
  isConnected(): boolean;
}

declare global {
  interface Window {
    aptos?: AptosWallet;
  }
}

export default function AptosOmniBets() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<{ address: string } | null>(null);

  useEffect(() => {
    // Check wallet connection status
    const checkConnection = () => {
      if (window.aptos?.isConnected()) {
        setConnected(true);
        setAccount(window.aptos?.account() || null);
      } else {
        setConnected(false);
        setAccount(null);
      }
    };

    checkConnection();
    
    // Listen for wallet connection changes
    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchMarkets = async () => {
    if (!connected) return;
    
    setIsLoading(true);
    try {
      // Get market count
      const countPayload = {
        function: `${MODULE_NAMES.PREDICTION_MARKET}::get_market_count`,
        arguments: [],
      };

      const countResponse = await aptosClient.view({
        payload: countPayload,
      });

      const marketCount = Number(countResponse[0]);
      
      if (marketCount > 0) {
        // Fetch first market for demo (in production, you'd fetch all markets)
        const marketPayload = {
          function: `${MODULE_NAMES.PREDICTION_MARKET}::get_market`,
          arguments: [1], // Market ID 1
        };

        const marketResponse = await aptosClient.view({
          payload: marketPayload,
        });

        const market: Market = {
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
        };

        setMarkets([market]);
        setSelectedMarket(market);
      }
    } catch (error) {
      console.error("Error fetching markets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (connected) {
      fetchMarkets();
    }
  }, [connected]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            OmniBets on Aptos
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Decentralized Prediction Markets powered by Aptos blockchain
          </p>
          
          <div className="flex justify-center items-center gap-4 mb-6">
            <AptosConnectButton />
            {connected && <AptosUSDCBalance />}
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="markets" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="markets">Markets</TabsTrigger>
            <TabsTrigger value="create">Create Market</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="markets" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Active Markets</h2>
              <Button
                onClick={fetchMarkets}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p>Loading markets...</p>
              </div>
            ) : markets.length > 0 ? (
              <div className="space-y-4">
                {markets.map((market) => (
                  <Card key={market.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{market.question}</CardTitle>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Market ID: {market.id} | Ends: {new Date(market.end_time * 1000).toLocaleString()}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                          <div className="text-xl font-bold text-green-600 dark:text-green-400">
                            {market.total_yes.toLocaleString()}
                          </div>
                          <div className="text-sm text-green-700 dark:text-green-300">YES</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded">
                          <div className="text-xl font-bold text-red-600 dark:text-red-400">
                            {market.total_no.toLocaleString()}
                          </div>
                          <div className="text-sm text-red-700 dark:text-red-300">NO</div>
                        </div>
                      </div>
                      <Button
                        onClick={() => setSelectedMarket(market)}
                        className="w-full"
                      >
                        View Market
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">
                    No markets found. Create the first market to get started!
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Betting Interface Modal */}
            {selectedMarket && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold">Market Details</h3>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedMarket(null)}
                      >
                        Close
                      </Button>
                    </div>
                    <AptosBettingInterface market={selectedMarket} />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="create">
            <AptosCreateMarket />
          </TabsContent>

          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>About OmniBets on Aptos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  OmniBets is a decentralized prediction market platform now running on Aptos blockchain.
                  Built with Move smart contracts, it offers fast, secure, and efficient betting on future events.
                </p>
                <div className="space-y-2">
                  <h4 className="font-semibold">Key Features:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Move smart contracts for security and efficiency</li>
                    <li>Aptos wallet integration</li>
                    <li>MockUSDC token for betting</li>
                    <li>Real-time market updates</li>
                    <li>Automated reward distribution</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">How to Use:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Connect your Aptos wallet</li>
                    <li>Create a prediction market or browse existing ones</li>
                    <li>Buy YES or NO tokens based on your prediction</li>
                    <li>Claim rewards when the market resolves</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
