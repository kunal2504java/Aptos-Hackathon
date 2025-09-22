"use client";

import { aptosClient, MODULE_NAMES } from "@/lib/aptos-client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";

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

interface AptosBettingInterfaceProps {
  market: Market;
}

interface AptosWallet {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  account(): { address: string } | null;
  isConnected(): boolean;
  signAndSubmitTransaction(payload: any): Promise<{ hash: string }>;
}

declare global {
  interface Window {
    aptos?: AptosWallet;
  }
}

export default function AptosBettingInterface({ market }: AptosBettingInterfaceProps) {
  const [amount, setAmount] = useState("");
  const [isYesToken, setIsYesToken] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [userPosition, setUserPosition] = useState({ yes_tokens: 0, no_tokens: 0 });
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

  const fetchUserPosition = async () => {
    if (!account) return;

    try {
      const payload = {
        function: `${MODULE_NAMES.PREDICTION_MARKET}::get_user_position`,
        arguments: [account.address],
      };

      const response = await aptosClient.view({
        payload,
      });

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

  const handleBuyTokens = async () => {
    if (!account || !amount || !window.aptos) return;

    setIsLoading(true);
    try {
      const amountInSmallestUnit = Math.floor(parseFloat(amount) * Math.pow(10, 6)); // 6 decimals for MockUSDC

      const payload = {
        type: "entry_function_payload",
        function: `${MODULE_NAMES.PREDICTION_MARKET}::buy_tokens`,
        arguments: [market.id, isYesToken, amountInSmallestUnit],
        type_arguments: [],
      };

      const response = await window.aptos.signAndSubmitTransaction(payload);
      await aptosClient.waitForTransaction({ transactionHash: response.hash });

      // Refresh user position after successful transaction
      await fetchUserPosition();
      setAmount("");
    } catch (error) {
      console.error("Error buying tokens:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!account || !window.aptos) return;

    setIsLoading(true);
    try {
      const payload = {
        type: "entry_function_payload",
        function: `${MODULE_NAMES.PREDICTION_MARKET}::claim_rewards`,
        arguments: [market.id],
        type_arguments: [],
      };

      const response = await window.aptos.signAndSubmitTransaction(payload);
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
        <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Market ID: {market.id} | Ends: {new Date(market.end_time * 1000).toLocaleString()}
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
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {market.total_no.toLocaleString()}
            </div>
            <div className="text-sm text-red-700 dark:text-red-300">Total NO</div>
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
              <Label htmlFor="amount">Amount (MockUSDC)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount to bet"
                min="0"
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
