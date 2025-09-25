"use client";

import type React from "react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Info } from "lucide-react";
import type { Market } from "../components/MarketPreview";
import USDCBalance from "./USDCBalance";
import { useWallet } from "@/lib/wallet-context";

import { CONTRACT_ADDRESS } from "@/lib/const";
// import MintandApprove from "./MintandApprove"; // TODO: Update for Aptos

interface BettingInterfaceProps {
  market: Market;
}

// Helper function to convert Wei to ETH
function ethToNumber(weiValue: string): number {
  return parseInt(weiValue) / 1e18;
}

export default function BettingInterface({ market }: BettingInterfaceProps) {
  // Separate states for YES and NO amounts
  const [yesAmount, setYesAmount] = useState("");
  const [noAmount, setNoAmount] = useState("");
  const [yesEstimatedReturn, setYesEstimatedReturn] = useState("0");
  const [noEstimatedReturn, setNoEstimatedReturn] = useState("0");
  const [activeTab, setActiveTab] = useState("yes");
  const { account, connected, signAndSubmitTransaction } = useWallet();
  
  // TODO: Replace with Aptos wallet integration
  const contractAddress = CONTRACT_ADDRESS;

  // Add refs for the input elements
  const yesInputRef = useRef<HTMLInputElement>(null);
  const noInputRef = useRef<HTMLInputElement>(null);

  // Convert Wei values to numbers
  const totalYesNum = ethToNumber(market.totalYes.toString());
  const totalNoNum = ethToNumber(market.totalNo.toString());

  // TODO: Add Aptos-specific network configuration if needed

  // Handlers for YES and NO inputs
  const handleYesAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Only update if the value is a valid number or empty
    if (value === "" || !isNaN(Number(value))) {
      setYesAmount(value);

      // Calculate estimated return only if there's a valid number
      if (value && !isNaN(Number(value))) {
        const inputAmount = Number(value);
        const yesPercentage = totalYesNum / (totalYesNum + totalNoNum);
        const estimatedReturnValue = inputAmount / yesPercentage;
        setYesEstimatedReturn(estimatedReturnValue.toFixed(2));
      } else {
        setYesEstimatedReturn("0");
      }
    }
  };

  const handleNoAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Only update if the value is a valid number or empty
    if (value === "" || !isNaN(Number(value))) {
      setNoAmount(value);

      // Calculate estimated return only if there's a valid number
      if (value && !isNaN(Number(value))) {
        const inputAmount = Number(value);
        const yesPercentage = totalYesNum / (totalYesNum + totalNoNum);
        const estimatedReturnValue = inputAmount / (1 - yesPercentage);
        setNoEstimatedReturn(estimatedReturnValue.toFixed(2));
      } else {
        setNoEstimatedReturn("0");
      }
    }
  };

  // TODO: Add Aptos-specific effects if needed

  // Parse endTime (already in ISO format from our transformation)
  const endTimeMs = new Date(market.endTime).getTime();
  const isDisabled = market.resolved || endTimeMs < Date.now();

  // Betting Form Handlers

  const handleBet = async (
    amount: number,
    side: "yes" | "no"
  ) => {
    if (!connected || !account) {
      alert("Please connect your wallet first!");
      return;
    }

    if (!contractAddress) {
      alert("Contract address not configured. Please check your environment variables.");
      return;
    }

    try {
      // Convert amount to the appropriate unit (assuming USDC has 6 decimals)
      const amountInMicroUSDC = Math.floor(amount * 1_000_000);
      
      const transaction = {
        type: "entry_function_payload",
        function: `${contractAddress}::prediction_market::buy_tokens`,
        type_arguments: [],
        arguments: [
          market.id, // market_id
          side === "yes", // is_yes_token
          amountInMicroUSDC.toString(), // amount
        ],
      };

      console.log(`Placing ${side.toUpperCase()} bet of ${amount} USDC on market ${market.id}`);
      console.log("Transaction payload:", transaction);
      
      const response = await signAndSubmitTransaction(transaction);
      console.log("Transaction hash:", response.hash);
      
      alert(`Success! Placed ${side.toUpperCase()} bet of ${amount} USDC.\n\nTransaction hash: ${response.hash}`);
      
      // Reset input field after successful bet
      if (side === "yes") {
        setYesAmount("");
      } else {
        setNoAmount("");
      }
      
      // TODO: Refresh market data to show updated totals
      
    } catch (error) {
      console.error("Error placing bet:", error);
      alert(`Failed to place bet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const BettingForm = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid grid-cols-2 mb-4 p-1 bg-gray-700 rounded-lg">
        <TabsTrigger
          value="yes"
          className="data-[state=active]:bg-green-500 data-[state=active]:text-black transition-all duration-200"
        >
          YES
        </TabsTrigger>
        <TabsTrigger
          value="no"
          className="data-[state=active]:bg-red-500 data-[state=active]:text-black transition-all duration-200"
        >
          NO
        </TabsTrigger>
      </TabsList>

      <TabsContent value="yes">
        <div className="space-y-4">
          <div>
            <label className="block font-mono text-lg mb-1">
              Amount to Bet
            </label>
            <Input
              ref={yesInputRef}
              type="number"
              placeholder="0.00"
              value={yesAmount}
              onChange={handleYesAmountChange}
              className="text-xl p-2"
              step="any" // Allow decimal numbers
            />
          </div>

          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="flex justify-between font-mono text-lg mb-1">
              <span>Current Odds</span>
              <span>
                {Math.round((totalYesNum / (totalYesNum + totalNoNum)) * 100)}%
              </span>
            </div>
            <div className="flex justify-between font-mono text-sm">
              <span>Estimated Return</span>
              <span>{yesEstimatedReturn}</span>
            </div>
          </div>

          <Button
            className="w-full font-pixel pixelated-border"
            disabled={!connected || !yesAmount || isNaN(Number(yesAmount))}
            onClick={() => handleBet(Number(yesAmount), "yes")}
          >
            {!connected ? "Connect Wallet to Bet" : "Bet on YES"} <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="no">
        <div className="space-y-4">
          <div>
            <label className="block font-mono text-lg mb-1">
              Amount to Bet
            </label>
            <Input
              ref={noInputRef}
              type="number"
              placeholder="0.00"
              value={noAmount}
              onChange={handleNoAmountChange}
              className="text-xl p-2"
              step="any" // Allow decimal numbers
            />
          </div>

          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="flex justify-between font-mono text-lg mb-1">
              <span>Current Odds</span>
              <span>
                {Math.round((totalNoNum / (totalYesNum + totalNoNum)) * 100)}%
              </span>
            </div>
            <div className="flex justify-between font-mono text-sm">
              <span>Estimated Return</span>
              <span>{noEstimatedReturn}</span>
            </div>
          </div>

          <Button
            className="w-full font-pixel pixelated-border"
            disabled={!connected || !noAmount || isNaN(Number(noAmount))}
            onClick={() => handleBet(Number(noAmount), "no")}
          >
            {!connected ? "Connect Wallet to Bet" : "Bet on NO"} <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="bg-gray-800 rounded-lg pixelated-border p-6 sticky top-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-pixel mb-4">Place Your Bet</h3>

        {/* TODO: Add Aptos USDC balance display */}
      </div>

      {isDisabled ? (
        <div className="bg-gray-700 p-4 rounded-lg font-mono text-center mb-4 mt-8 text-lg">
          This market is no longer accepting bets
        </div>
      ) : (
        <div>
          <div className="bg-gray-700 p-3 rounded-lg mb-4">
            <div className="flex items-center font-mono text-sm">
              <div className="w-5 h-5 bg-blue-500 flex items-center justify-center text-black text-xs mr-2 rounded-sm">
                A
              </div>
              <span>Betting on Aptos Testnet</span>
            </div>
          </div>
          {/* TODO: Add Aptos wallet connection and token approval UI */}
          <BettingForm />
        </div>
      )}

      <div className="mt-6 bg-gray-700 p-4 rounded-lg">
        <div className="flex items-start font-mono text-sm">
          <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="mb-2 text-lg">
              OmniBets uses LMSR (Logarithmic Market Scoring Rule) to determine
              prices and payouts.
            </p>
            <p className="text-lg">
              The earlier you bet, the better your potential returns!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
