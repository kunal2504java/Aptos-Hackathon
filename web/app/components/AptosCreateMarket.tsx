"use client";

import { aptosClient, MODULE_NAMES, CONTRACT_ADDRESSES } from "@/lib/aptos-client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import { useWallet } from "@/lib/wallet-context";

export default function AptosCreateMarket() {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const [question, setQuestion] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastCreatedMarketId, setLastCreatedMarketId] = useState<number | null>(null);

  const handleCreateMarket = async () => {
    if (!account || !question || !endTime) return;

    // Check if contracts are deployed
    if (CONTRACT_ADDRESSES.PREDICTION_MARKET === "0x1") {
      alert("Contracts not deployed yet! Please deploy the Move contracts first.\n\nSee the deployment guide in boilerplate/aptos-contracts/README.md");
      return;
    }

    setIsLoading(true);
    try {
      // Convert end time to Unix timestamp
      const endTimeTimestamp = Math.floor(new Date(endTime).getTime() / 1000);

      const payload = {
        type: "entry_function_payload",
        function: `${MODULE_NAMES.PREDICTION_MARKET}::create_market_entry`,
        arguments: [question, endTimeTimestamp],
        type_arguments: [],
      };

      console.log("Transaction payload:", payload);
      console.log("Module name:", MODULE_NAMES.PREDICTION_MARKET);

      const response = await signAndSubmitTransaction(payload);
      await aptosClient.waitForTransaction({ transactionHash: response.hash });

      // Get the market count to determine the new market ID
      const countPayload = {
        function: `${MODULE_NAMES.PREDICTION_MARKET}::get_market_count`,
        arguments: [],
      };
      
      const countResponse = await aptosClient.view({ payload: countPayload });
      const newMarketId = Number(countResponse[0]);
      setLastCreatedMarketId(newMarketId);

      // Reset form
      setQuestion("");
      setEndTime("");
      
      alert(`Market created successfully! Market ID: ${newMarketId}`);
    } catch (error) {
      console.error("Error creating market:", error);
      alert("Failed to create market. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitializeLiquidity = async () => {
    if (!account) return;

    if (!lastCreatedMarketId) {
      alert("Please create a market first, or specify a market ID to initialize.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        type: "entry_function_payload",
        function: `${MODULE_NAMES.PREDICTION_MARKET}::initialize_liquidity`,
        arguments: [lastCreatedMarketId],
        type_arguments: [],
      };

      console.log("Initializing liquidity for market ID:", lastCreatedMarketId);

      const response = await signAndSubmitTransaction(payload);
      await aptosClient.waitForTransaction({ transactionHash: response.hash });

      alert(`Liquidity initialized successfully for Market ID: ${lastCreatedMarketId}`);
    } catch (error) {
      console.error("Error initializing liquidity:", error);
      if (error instanceof Error && error.message.includes("E_LIQUIDITY_NOT_INITIALIZED")) {
        alert("This market's liquidity is already initialized. You can only initialize liquidity once per market.");
      } else {
        alert("Failed to initialize liquidity. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Prediction Market
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="question">Market Question</Label>
            <Textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Will Bitcoin reach $100,000 by end of 2024?"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <Button
            onClick={handleCreateMarket}
            disabled={!question || !endTime || isLoading || !connected}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Market...
              </>
            ) : (
              "Create Market"
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Initialize Liquidity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Initialize liquidity for the newly created market to enable betting.
          </p>
          {lastCreatedMarketId && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
              Last created market ID: {lastCreatedMarketId}
            </p>
          )}
          <Button
            onClick={handleInitializeLiquidity}
            disabled={isLoading || !connected || !lastCreatedMarketId}
            variant="outline"
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Initializing...
              </>
            ) : (
              `Initialize Liquidity${lastCreatedMarketId ? ` (Market ${lastCreatedMarketId})` : ''}`
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
