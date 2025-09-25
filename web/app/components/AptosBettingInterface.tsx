"use client";

import { aptosClient, MODULE_NAMES } from "@/lib/aptos-client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { useWallet } from "@/lib/wallet-context";

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

interface AptosBettingInterfaceProps {
  market: Market;
  onMarketUpdate?: () => void; // Callback to refresh market data
  preFilledParams?: {
    side: string;
    amount: string;
  } | null;
}

export default function AptosBettingInterface({ market, onMarketUpdate, preFilledParams }: AptosBettingInterfaceProps) {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const [amount, setAmount] = useState("");
  const [isYesToken, setIsYesToken] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [userPosition, setUserPosition] = useState({ yes_tokens: 0, no_tokens: 0 });

  // Helper function to call view functions using raw fetch API with rate limiting
  const callViewFunction = async (functionName: string, args: any[] = []) => {
    console.log("Calling view function:", functionName);
    console.log("Arguments:", args);
    
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

  const fetchUserPosition = async () => {
    if (!account) return;

    try {
      const response = await callViewFunction(`${MODULE_NAMES.PREDICTION_MARKET}::get_user_position`, [account.address]);

      setUserPosition({
        yes_tokens: Number(response[0]),
        no_tokens: Number(response[1]),
      });
    } catch (error) {
      console.error("Error fetching user position:", error);
    }
  };

  useEffect(() => {
    if (connected && account) {
      fetchUserPosition();
    }
  }, [connected, account]);

  // Apply pre-filled parameters from Telegram bot
  useEffect(() => {
    if (preFilledParams) {
      setAmount(preFilledParams.amount);
      setIsYesToken(preFilledParams.side.toLowerCase() === 'yes');
    }
  }, [preFilledParams]);

  const handleBuyTokens = async () => {
    if (!account || !amount) return;

    // Check if there are enough tokens available
    const availableTokens = isYesToken ? market.yes_quantity : market.no_quantity;
    const betAmount = Math.floor(parseFloat(amount));
    
    console.log("=== BETTING DEBUG ===");
    console.log("Market data:", market);
    console.log("Is Yes Token:", isYesToken);
    console.log("Available tokens:", availableTokens);
    console.log("Bet amount:", betAmount);
    console.log("Amount string:", amount);
    
    if (betAmount > availableTokens) {
      alert(`Insufficient liquidity! Only ${availableTokens.toLocaleString()} ${isYesToken ? 'YES' : 'NO'} tokens available.`);
      return;
    }

    if (availableTokens === 0) {
      alert(`${isYesToken ? 'YES' : 'NO'} tokens are sold out! Try the other option.`);
      return;
    }

    // Check minimum bet amount (Petra wallet limitation)
    if (betAmount < 0.5) {
      alert(`Minimum bet amount is 0.5 MockUSDC. Please enter a higher amount.`);
      return;
    }

    setIsLoading(true);
    try {
      // Convert amount to the same units as market quantities (no decimal conversion needed)
      const amountInSmallestUnit = Math.floor(parseFloat(amount));

      const payload = {
        type: "entry_function_payload",
        function: `${MODULE_NAMES.PREDICTION_MARKET}::buy_tokens` as `${string}::${string}::${string}`,
        arguments: [market.id, isYesToken, amountInSmallestUnit],
        type_arguments: [],
      };

      console.log("=== BETTING DEBUG ===");
      console.log("Market data:", market);
      console.log("Is Yes Token:", isYesToken);
      console.log("Available tokens:", isYesToken ? market.yes_quantity : market.no_quantity);
      console.log("Bet amount:", amountInSmallestUnit);
      console.log("Amount string:", amount);
      console.log("Function:", `${MODULE_NAMES.PREDICTION_MARKET}::buy_tokens`);
      console.log("Arguments:", [market.id, isYesToken, amountInSmallestUnit]);
      console.log("Betting transaction payload:", payload);

      const response = await signAndSubmitTransaction(payload);
      await aptosClient.waitForTransaction({ transactionHash: response.hash });

      // Refresh user position after successful transaction
      await fetchUserPosition();
      
      // Refresh market data if callback provided
      if (onMarketUpdate) {
        onMarketUpdate();
      }
      
      setAmount("");
      alert(`Successfully placed ${isYesToken ? "YES" : "NO"} bet of ${amount} MockUSDC!`);
    } catch (error) {
      console.error("Error buying tokens:", error);
      let errorMessage = "Failed to place bet. ";
      
      if (error instanceof Error) {
        if (error.message.includes("E_INSUFFICIENT_BALANCE")) {
          errorMessage += "Insufficient MockUSDC balance. Please mint more tokens.";
        } else if (error.message.includes("E_INVALID_AMOUNT")) {
          errorMessage += "Invalid amount. Please enter a valid number.";
        } else if (error.message.includes("E_MARKET_NOT_FOUND")) {
          errorMessage += "Market not found.";
        } else if (error.message.includes("E_LIQUIDITY_NOT_INITIALIZED")) {
          errorMessage += "Market liquidity not initialized.";
        } else {
          errorMessage += error.message;
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!account) return;

    setIsLoading(true);
    try {
      const payload = {
        type: "entry_function_payload",
        function: `${MODULE_NAMES.PREDICTION_MARKET}::claim_rewards` as `${string}::${string}::${string}`,
        arguments: [market.id],
        type_arguments: [],
      };

      const response = await signAndSubmitTransaction(payload);
      await aptosClient.waitForTransaction({ transactionHash: response.hash });

      // Refresh user position after successful transaction
      await fetchUserPosition();
    } catch (error) {
      console.error("Error claiming rewards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isMarketResolved = market.state === 1; // MARKET_RESOLVED
  const canClaimRewards = isMarketResolved && (userPosition.yes_tokens > 0 || userPosition.no_tokens > 0);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center">
          {market.question}
        </CardTitle>
        <div className="text-sm text-gray-600 dark:text-gray-400 text-center flex items-center justify-center gap-2">
          Market ID: {market.id} | Ends: {new Date(market.endTime).toLocaleString()}
          <button 
            onClick={() => window.location.reload()} 
            className="text-blue-500 hover:text-blue-700 text-xs underline"
          >
            Refresh Data
          </button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Market Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {market.total_yes.toLocaleString()}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">Total YES</div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
              Available: {market.yes_quantity.toLocaleString()}
            </div>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {market.total_no.toLocaleString()}
            </div>
            <div className="text-sm text-red-700 dark:text-red-300">Total NO</div>
            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
              Available: {market.no_quantity.toLocaleString()}
            </div>
          </div>
        </div>

        {/* User Position */}
        {(userPosition.yes_tokens > 0 || userPosition.no_tokens > 0) && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Your Position</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-600 dark:text-green-400">YES Tokens:</span>
                <span className="ml-2 font-medium">{userPosition.yes_tokens}</span>
              </div>
              <div>
                <span className="text-red-600 dark:text-red-400">NO Tokens:</span>
                <span className="ml-2 font-medium">{userPosition.no_tokens}</span>
              </div>
            </div>
          </div>
        )}

        {/* Betting Interface */}
        {!isMarketResolved && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (MockUSDC) - Min: 0.5</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount to bet (min: 0.5)"
                min="0.5"
                step="0.01"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={isYesToken ? "default" : "outline"}
                onClick={() => setIsYesToken(true)}
                className="flex-1 flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Buy YES
              </Button>
              <Button
                variant={!isYesToken ? "default" : "outline"}
                onClick={() => setIsYesToken(false)}
                className="flex-1 flex items-center gap-2"
              >
                <TrendingDown className="w-4 h-4" />
                Buy NO
              </Button>
            </div>

            <Button
              onClick={handleBuyTokens}
              disabled={!amount || isLoading || !connected}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Buy ${isYesToken ? "YES" : "NO"} Tokens`
              )}
            </Button>
          </div>
        )}

        {/* Claim Rewards */}
        {canClaimRewards && (
          <Button
            onClick={handleClaimRewards}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Claiming...
              </>
            ) : (
              "Claim Rewards"
            )}
          </Button>
        )}

        {/* Market Status */}
        <div className="text-center">
          {isMarketResolved ? (
            <div className="text-lg font-semibold">
              Market Resolved: {market.won ? "YES Won" : "NO Won"}
            </div>
          ) : (
            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              Market Active
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
