"use client";

import { aptosClient, MODULE_NAMES } from "@/lib/aptos-client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";

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

export default function AptosCreateMarket() {
  const [question, setQuestion] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

  const handleCreateMarket = async () => {
    if (!account || !question || !endTime || !window.aptos) return;

    setIsLoading(true);
    try {
      // Convert end time to Unix timestamp
      const endTimeTimestamp = Math.floor(new Date(endTime).getTime() / 1000);

      const payload = {
        type: "entry_function_payload",
        function: `${MODULE_NAMES.PREDICTION_MARKET}::create_market`,
        arguments: [question, endTimeTimestamp],
        type_arguments: [],
      };

      const response = await window.aptos.signAndSubmitTransaction(payload);
      await aptosClient.waitForTransaction({ transactionHash: response.hash });

      // Reset form
      setQuestion("");
      setEndTime("");
      
      alert("Market created successfully!");
    } catch (error) {
      console.error("Error creating market:", error);
      alert("Failed to create market. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitializeLiquidity = async () => {
    if (!account || !window.aptos) return;

    setIsLoading(true);
    try {
      // For demo purposes, we'll initialize liquidity for market ID 1
      // In a real app, you'd get the market ID from the creation response
      const payload = {
        type: "entry_function_payload",
        function: `${MODULE_NAMES.PREDICTION_MARKET}::initialize_liquidity`,
        arguments: [1], // Market ID 1
        type_arguments: [],
      };

      const response = await window.aptos.signAndSubmitTransaction(payload);
      await aptosClient.waitForTransaction({ transactionHash: response.hash });

      alert("Liquidity initialized successfully!");
    } catch (error) {
      console.error("Error initializing liquidity:", error);
      alert("Failed to initialize liquidity. Please try again.");
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
          <CardTitle>Initialize Liquidity (Demo)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Initialize liquidity for the first market to enable betting.
          </p>
          <Button
            onClick={handleInitializeLiquidity}
            disabled={isLoading || !connected}
            variant="outline"
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Initializing...
              </>
            ) : (
              "Initialize Liquidity"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
