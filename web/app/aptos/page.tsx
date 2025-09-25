"use client";

import { aptosClient, MODULE_NAMES } from "@/lib/aptos-client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AptosConnectButton from "@/app/components/AptosConnectButton";
import AptosUSDCBalance from "@/app/components/AptosUSDCBalance";
import AptosBettingInterface from "@/app/components/AptosBettingInterface";
import AptosCreateMarket from "@/app/components/AptosCreateMarket";
import NFTDashboard from "@/app/components/NFTDashboard";
import WinningsAndRewards from "@/app/components/WinningsAndRewards";
import NFTMarketplace from "@/app/components/NFTMarketplace";
import NFTLendingSystem from "@/app/components/NFTLendingSystem";
import WalletDebug from "@/app/components/WalletDebug";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, MessageCircle, Twitter } from "lucide-react";
import { useWallet } from "@/lib/wallet-context";
import AIResolutionButton from "@/app/components/AIResolutionButton";
import LiquidEther from "@/app/components/LiquidEther";

interface Market {
  id: number;
  question: string;
  endTime: string; // ISO date string
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

export default function AptosOmniBets() {
  const { account, connected } = useWallet();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [totalMarketCount, setTotalMarketCount] = useState(0);
  const [showBettingInterface, setShowBettingInterface] = useState(false);
  const [showOnlyActive, setShowOnlyActive] = useState(false); // Temporarily set to false to see all markets
  const [telegramBetParams, setTelegramBetParams] = useState<{
    market: string;
    side: string;
    amount: string;
    user: string;
  } | null>(null);

  // Helper function to call view functions using raw fetch API with rate limiting
  const callViewFunction = async (functionName: string, args: any[] = []) => {
    console.log("Calling view function:", functionName);
    console.log("Arguments:", args);
    
    try {
      const requestBody = {
        function: functionName,
        type_arguments: [],
        arguments: args.map(arg => arg.toString()), // Convert all arguments to strings
      };
      
      const response = await fetch('https://fullnode.testnet.aptoslabs.com/v1/view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer aptoslabs_eJJWS8wiFGb_Ae2G5Vzscy8XDVXB4qS9p1J6nzAupxez9',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response error text:", errorText);
        
        if (response.status === 429) {
          console.warn("Rate limit exceeded, waiting 5 seconds...");
          await new Promise(resolve => setTimeout(resolve, 5000));
          throw new Error("Rate limit exceeded. Please wait a moment and try again.");
        }
        
        throw new Error(`HTTP error! status: ${response.status}, text: ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Raw fetch response:", data);
      return data;
    } catch (error) {
      console.error("Raw fetch failed:", error);
      throw error;
    }
  };

  const fetchMarkets = async () => {
    if (!connected) {
      console.log("Wallet not connected, skipping market fetch");
      return;
    }
    
    setIsLoading(true);
    try {
      console.log("=== FETCHING MARKETS ===");
      console.log("Connected:", connected);
      console.log("Account:", account);
      
      // Get market count
      console.log("Fetching market count...");
      
      let countResponse;
      try {
        countResponse = await callViewFunction(`${MODULE_NAMES.PREDICTION_MARKET}::get_market_count`, []);
        console.log("Count response:", countResponse);
      } catch (viewError) {
        console.error("Error calling aptosClient.view:", viewError);
        throw new Error(`Failed to fetch market count: ${viewError}`);
      }

      if (!countResponse || countResponse.length === 0) {
        console.error("Empty or invalid count response:", countResponse);
        throw new Error("Invalid response from get_market_count");
      }

      const marketCount = Number(countResponse[0]);
      console.log("Market count:", marketCount);
      setTotalMarketCount(marketCount);
      
      if (isNaN(marketCount) || marketCount < 0) {
        console.error("Invalid market count:", marketCount);
        throw new Error(`Invalid market count: ${marketCount}`);
      }
      
      if (marketCount > 0) {
2        // Fetch markets (limit to first 10 to get more markets)
        const maxMarkets = Math.min(marketCount, 10);
        const allMarkets: Market[] = [];
        
        console.log(`Fetching first ${maxMarkets} markets out of ${marketCount} total...`);
        
        for (let i = 1; i <= maxMarkets; i++) {
          try {
            console.log(`Fetching market ${i}...`);

            const marketResponse = await callViewFunction(`${MODULE_NAMES.PREDICTION_MARKET}::get_market`, [i]);

            console.log(`Raw market ${i} response:`, marketResponse);
            
            // Validate response - expecting an array with one object
            if (!marketResponse || marketResponse.length === 0) {
              console.error(`Invalid market response for market ${i}:`, marketResponse);
              continue;
            }

            // Extract the market object from the response array
            const marketData = marketResponse[0];
            console.log(`Market ${i} data object:`, marketData);
            
            if (!marketData || typeof marketData !== 'object') {
              console.error(`Invalid market data for market ${i}:`, marketData);
              continue;
            }

            const market: Market = {
              id: Number(marketData.id || i),
              question: String(marketData.question || 'Unknown Question'),
              endTime: new Date(Number(marketData.end_time || 0) * 1000).toISOString(), // Convert Unix timestamp to ISO string
              total_staked: Number(marketData.total_staked || 0),
              total_yes: Number(marketData.total_yes || 0),
              total_no: Number(marketData.total_no || 0),
              state: Number(marketData.state || 0),
              won: Boolean(marketData.won || false),
              creator: String(marketData.creator || '0x0'),
              yes_quantity: Number(marketData.yes_quantity || 0),
              no_quantity: Number(marketData.no_quantity || 0),
              liquidity_initialized: Boolean(marketData.liquidity_initialized || false),
            };

            console.log(`Processed market ${i} data:`, market);
            allMarkets.push(market);
            
            // Add delay between requests to avoid rate limiting
            if (i < maxMarkets) {
              console.log(`Waiting 500ms before fetching next market...`);
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (error) {
            console.error(`Error fetching market ${i}:`, error);
            // Continue with other markets even if one fails
          }
        }

        console.log("All markets fetched:", allMarkets);
        console.log("Number of markets fetched:", allMarkets.length);
        console.log("Market states:", allMarkets.map(m => ({ id: m.id, state: m.state, question: m.question })));
        console.log("Active markets (state === 0):", allMarkets.filter(m => m.state === 0).length);
        console.log("Setting markets state...");
        setMarkets(allMarkets);
        
        // Set the latest market as selected by default
        if (allMarkets.length > 0) {
          console.log("Setting selected market to:", allMarkets[allMarkets.length - 1]);
          setSelectedMarket(allMarkets[allMarkets.length - 1]);
        } else {
          console.log("No markets to set as selected");
        }
      } else {
        console.log("No markets found on blockchain (marketCount = 0)");
        setMarkets([]);
      }
    } catch (error) {
      console.error("Error fetching markets:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        connected,
        account
      });
      setMarkets([]); // Clear markets on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (connected) {
      fetchMarkets();
    }
  }, [connected]);

  // Debug effect to log markets state changes
  useEffect(() => {
    console.log("Markets state changed:", markets);
    console.log("Markets length:", markets.length);
  }, [markets]);

  // Handle Telegram bot bet parameters from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const bet = urlParams.get('bet');
      const market = urlParams.get('market');
      const side = urlParams.get('side');
      const amount = urlParams.get('amount');
      const user = urlParams.get('user');

      if (bet === 'true' && market && side && amount && user) {
        setTelegramBetParams({ market, side, amount, user });
        
        // Find the market and auto-select it
        const marketId = parseInt(market);
        const targetMarket = markets.find(m => m.id === marketId);
        if (targetMarket) {
          setSelectedMarket(targetMarket);
          setShowBettingInterface(true);
        }
      }
    }
  }, [markets]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 3D Fluid Background */}
      <div className="absolute inset-0 z-0">
        <LiquidEther
          colors={['#5227FF', '#FF9FFC', '#B19EEF']}
          mouseForce={20}
          cursorSize={100}
          isViscous={false}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
        />
      </div>
      
      {/* Content Layer */}
      <div className="relative z-10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
            OmniBets on Aptos
          </h1>
          <p className="text-lg text-gray-200 mb-6 drop-shadow-md">
            Decentralized Prediction Markets powered by Aptos blockchain
          </p>
          
          <div className="flex justify-center items-center gap-4 mb-6">
            <AptosConnectButton />
            {connected && <AptosUSDCBalance />}
          </div>
        </div>

        {/* Telegram Bot Notification */}
        {telegramBetParams && (
          <div className="bg-blue-600/90 backdrop-blur-sm text-white p-4 rounded-lg mb-6 border border-blue-400/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageCircle className="h-5 w-5" />
                <div>
                  <h3 className="font-semibold">Telegram Bot Bet Request</h3>
                  <p className="text-sm text-blue-100">
                    Pre-filled bet: {telegramBetParams.side.toUpperCase()} {telegramBetParams.amount} MockUSDC
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTelegramBetParams(null)}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue={tabParam || "markets"} className="w-full">
        <TabsList className="grid w-full grid-cols-9 bg-white/20 backdrop-blur-sm border border-white/30 h-12">
          <TabsTrigger value="markets" className="data-[state=active]:bg-white/30 data-[state=active]:text-white text-gray-200 hover:text-white text-xs px-2 py-1">Markets</TabsTrigger>
          <TabsTrigger value="winnings" className="data-[state=active]:bg-white/30 data-[state=active]:text-white text-gray-200 hover:text-white text-xs px-2 py-1">Winnings</TabsTrigger>
          <TabsTrigger value="marketplace" className="data-[state=active]:bg-white/30 data-[state=active]:text-white text-gray-200 hover:text-white text-xs px-1 py-1">Marketplace</TabsTrigger>
          <TabsTrigger value="lending" className="data-[state=active]:bg-white/30 data-[state=active]:text-white text-gray-200 hover:text-white text-xs px-1 py-1">Lending</TabsTrigger>
          <TabsTrigger value="create" className="data-[state=active]:bg-white/30 data-[state=active]:text-white text-gray-200 hover:text-white text-xs px-1 py-1">Create</TabsTrigger>
          <TabsTrigger value="nfts" className="data-[state=active]:bg-white/30 data-[state=active]:text-white text-gray-200 hover:text-white text-xs px-1 py-1">NFTs</TabsTrigger>
          <TabsTrigger value="bots" className="data-[state=active]:bg-white/30 data-[state=active]:text-white text-gray-200 hover:text-white text-xs px-2 py-1">Bots</TabsTrigger>
          <TabsTrigger value="debug" className="data-[state=active]:bg-white/30 data-[state=active]:text-white text-gray-200 hover:text-white text-xs px-2 py-1">Debug</TabsTrigger>
          <TabsTrigger value="about" className="data-[state=active]:bg-white/30 data-[state=active]:text-white text-gray-200 hover:text-white text-xs px-2 py-1">About</TabsTrigger>
        </TabsList>

          <TabsContent value="markets" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-white drop-shadow-md">
                {showOnlyActive ? 'Active Markets' : 'All Markets'}
              </h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showOnlyActive"
                    checked={showOnlyActive}
                    onChange={(e) => setShowOnlyActive(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="showOnlyActive" className="text-sm text-gray-200">
                    Show only active markets
                  </label>
                </div>
                <Button
                  onClick={() => {
                    console.log("Manual refresh clicked");
                    fetchMarkets();
                  }}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/40 hover:border-white/60"
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
            </div>

            {/* Debug Info */}
            <div className="debug-info mb-6 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-lg font-semibold text-white mb-3">Debug Information</div>
              <div className="space-y-2">
                <div className="debug-info-item">
                  <span className="debug-info-label text-gray-200">Connection Status:</span>
                  <span className={connected ? "status-connected" : "status-disconnected"}>
                    {connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="debug-info-item">
                  <span className="debug-info-label text-gray-200">Account:</span>
                  <span className="debug-info-value font-mono text-xs text-white">
                    {account?.address ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : 'None'}
                  </span>
                </div>
                <div className="debug-info-item">
                  <span className="debug-info-label text-gray-200">Markets Loaded:</span>
                  <span className="debug-info-value text-white">{markets.length}</span>
                </div>
                <div className="debug-info-item">
                  <span className="debug-info-label text-gray-200">Total Markets:</span>
                  <span className="debug-info-value text-white">{totalMarketCount}</span>
                </div>
                <div className="debug-info-item">
                  <span className="debug-info-label text-gray-200">Loading:</span>
                  <span className="debug-info-value text-white">{isLoading ? 'Yes' : 'No'}</span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    onClick={async () => {
                      console.log("=== MANUAL MARKET COUNT TEST ===");
                      try {
                        console.log("Testing market count...");
                        const response = await callViewFunction(`${MODULE_NAMES.PREDICTION_MARKET}::get_market_count`, []);
                        console.log("Direct market count response:", response);
                        alert(`Market count: ${response[0]}`);
                      } catch (error) {
                        console.error("Manual test error:", error);
                        alert(`Error: ${error}`);
                      }
                    }}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/40 hover:border-white/60"
                    size="sm"
                  >
                    Test Market Count
                  </Button>
                  <Button
                    onClick={() => {
                      console.log("=== MANUAL FETCH MARKETS TEST ===");
                      console.log("Current markets state:", markets);
                      console.log("Current markets length:", markets.length);
                      fetchMarkets();
                    }}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/40 hover:border-white/60"
                    size="sm"
                  >
                    Test Fetch Markets
                  </Button>
                  {totalMarketCount > markets.length && (
                    <Button
                      onClick={() => {
                        console.log("=== LOAD MORE MARKETS ===");
                        console.log(`Loading more markets. Current: ${markets.length}, Total: ${totalMarketCount}`);
                        // TODO: Implement load more functionality
                        alert(`Loading more markets... Current: ${markets.length}, Total: ${totalMarketCount}`);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      Load More Markets
                    </Button>
                  )}
              </div>
            </div>

                   {isLoading ? (
                     <div className="empty-state">
                       <Loader2 className="loading-spinner w-8 h-8 mx-auto mb-4 text-white" />
                       <p className="empty-state-description text-gray-200">Loading markets...</p>
                     </div>
            ) : markets.length > 0 ? (
              <div className="space-y-4">
                {markets
                  .filter(market => {
                    console.log(`Market ${market.id} state: ${market.state}, showOnlyActive: ${showOnlyActive}`);
                    return showOnlyActive ? market.state === 0 : true;
                  })
                  .map((market) => (
                  <Card key={market.id} className="cursor-pointer hover:shadow-lg transition-shadow bg-white/95 backdrop-blur-sm border-white/40 shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-900 font-semibold">{market.question}</CardTitle>
                      <div className="text-sm text-gray-700">
                        Market ID: {market.id} | Ends: {new Date(market.endTime).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          market.state === 0 ? 'bg-green-100 text-green-800' : 
                          market.state === 1 ? 'bg-blue-100 text-blue-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {market.state === 0 ? '🟢 Active' : 
                           market.state === 1 ? '🔵 Resolved' : 
                           '🔴 Cancelled'}
                        </span>
                        {market.state === 1 && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {market.won ? '✅ YES Won' : '❌ NO Won'}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-3 bg-green-100 rounded-lg border border-green-200">
                          <div className="text-xl font-bold text-green-700">
                            {market.total_yes.toLocaleString()}
                          </div>
                          <div className="text-sm text-green-600 font-medium">YES</div>
                        </div>
                        <div className="text-center p-3 bg-red-100 rounded-lg border border-red-200">
                          <div className="text-xl font-bold text-red-700">
                            {market.total_no.toLocaleString()}
                          </div>
                          <div className="text-sm text-red-600 font-medium">NO</div>
                        </div>
                      </div>
                      <Button
                        onClick={() => setSelectedMarket(market)}
                        className={`w-full font-semibold mb-2 ${
                          market.state === 0 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        }`}
                        disabled={market.state !== 0}
                      >
                        {market.state === 0 ? 'View Market' : 
                         market.state === 1 ? 'Market Resolved' : 
                         'Market Cancelled'}
                      </Button>
                      
                      {/* AI Resolution Button - only show for active markets */}
                      {market.state === 0 && (
                        <AIResolutionButton 
                          market={market}
                          onResolutionComplete={(result) => {
                            console.log('AI Resolution Complete:', result);
                            // Optionally refresh markets or show notification
                            if (result.shouldResolve) {
                              // Could trigger a market resolution here
                              console.log(`Market ${market.id} should be resolved with outcome: ${result.outcome}`);
                            }
                          }}
                        />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
                   ) : (
                     <div className="empty-state">
                       <div className="empty-state-title text-white">
                         {showOnlyActive ? 'No Active Markets Found' : 'No Markets Found'}
                       </div>
                       <div className="empty-state-description text-gray-200">
                         {showOnlyActive 
                           ? 'No active prediction markets available. Try unchecking "Show only active markets" to see resolved markets, or create a new market!'
                           : 'No prediction markets available. Create the first market to get started!'
                         }
                       </div>
                       <div className="flex gap-3 justify-center">
                         {showOnlyActive && (
                           <Button 
                             onClick={() => setShowOnlyActive(false)}
                             className="bg-white/20 hover:bg-white/30 text-white border-white/40 hover:border-white/60"
                           >
                             Show All Markets
                           </Button>
                         )}
                         <Button 
                           onClick={() => {
                             // Switch to create tab
                             const createTab = document.querySelector('[value="create"]') as HTMLElement;
                             createTab?.click();
                           }}
                           className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                         >
                           Create New Market
                         </Button>
                       </div>
                     </div>
            )}
          </TabsContent>

          <TabsContent value="winnings">
            <WinningsAndRewards />
          </TabsContent>

          <TabsContent value="marketplace">
            <NFTMarketplace />
          </TabsContent>

          <TabsContent value="lending">
            <NFTLendingSystem />
          </TabsContent>

          <TabsContent value="create">
            <AptosCreateMarket />
          </TabsContent>

          <TabsContent value="nfts">
            <NFTDashboard />
          </TabsContent>

          <TabsContent value="bots">
            <Card>
              <CardHeader>
                <CardTitle>Bot Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">🤖 Social Betting</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Create bets and markets through Telegram and Twitter!
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="w-5 h-5 text-blue-500" />
                        <h4 className="font-semibold">Telegram Bot</h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Use commands like /bet, /create, /markets
                      </p>
                      <Button
                        onClick={() => window.open('/bots', '_blank')}
                        size="sm"
                        variant="outline"
                      >
                        Test Bot
                      </Button>
                    </Card>
                    
                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Twitter className="w-5 h-5 text-blue-400" />
                        <h4 className="font-semibold">Twitter Bot</h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Mention @OmniBetsAptos with commands
                      </p>
                      <Button
                        onClick={() => window.open('/bots', '_blank')}
                        size="sm"
                        variant="outline"
                      >
                        Test Bot
                      </Button>
                    </Card>
                  </div>
                  
                  <div className="text-center">
                    <Button
                      onClick={() => window.open('/bots', '_blank')}
                      className="w-full"
                    >
                      Open Bot Testing Interface
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="debug">
            <WalletDebug />
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
                <AptosBettingInterface 
                  market={selectedMarket} 
                  onMarketUpdate={fetchMarkets}
                  preFilledParams={telegramBetParams ? {
                    side: telegramBetParams.side,
                    amount: telegramBetParams.amount
                  } : null}
                />
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
