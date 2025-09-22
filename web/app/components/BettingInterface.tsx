"use client";

import type React from "react";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Info } from "lucide-react";
import type { Market } from "../components/MarketPreview";
import USDCBalance from "./USDCBalance";

import {
  PredictionMarketAddressFujiA,
  PredictionMarketAddressFujiB,
  PredictionMarketAddressFujiB_ABI,
  USDC_ADDRESS_FUJI_A,
  USDC_ADDRESS_FUJI_B,
} from "@/lib/const";
import { useAccount } from "wagmi";
import { client, walletClient } from "@/lib/client";
import MintandApprove from "./MintandApprove";

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
  const [selectedChain, setSelectedChain] = useState("chainA");
  const [marketAddress, setMarketAddress] = useState(
    PredictionMarketAddressFujiA
  );
  const [usdcAddress, setUsdcAddress] = useState(USDC_ADDRESS_FUJI_A);
  const { address } = useAccount();

  // Add refs for the input elements
  const yesInputRef = useRef<HTMLInputElement>(null);
  const noInputRef = useRef<HTMLInputElement>(null);

  // Convert Wei values to numbers
  const totalYesNum = ethToNumber(market.totalYes.toString());
  const totalNoNum = ethToNumber(market.totalNo.toString());

  // Chain-specific data for Avalanche Fuji
  const chainData = {
    chainA: {
      name: "Fuji A",
      icon: "A",
      color: "bg-red-400",
    },
    chainB: {
      name: "Fuji B",
      icon: "B",
      color: "bg-orange-400",
    },
  };

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

  useEffect(() => {
    if (selectedChain === "chainA") {
      setMarketAddress(PredictionMarketAddressFujiA);
      setUsdcAddress(USDC_ADDRESS_FUJI_A);
    } else {
      setMarketAddress(PredictionMarketAddressFujiB);
      setUsdcAddress(USDC_ADDRESS_FUJI_B);
    }
  }, [selectedChain]);

  // Convert endTime from seconds to milliseconds for timestamp comparison
  const endTimeMs = Number(market.endTime) * 1000;
  const isDisabled = market.resolved || endTimeMs < Date.now();

  // Betting Form Handlers

  const handleBet = async (
    amount: number,
    side: "yes" | "no",
    marketAddress: string
  ) => {
    if (!address) {
      console.error("No wallet connected");
      return;
    }

    if (!walletClient) {
      console.error("Wallet client not initialized");
      return;
    }

    try {
      const tx = await walletClient.writeContract({
        address: marketAddress as `0x${string}`,
        abi: PredictionMarketAddressSepoliaB_ABI,
        functionName: "buy",
        args: [Number(market.id), side === "yes", BigInt(amount * 1e18)],
        account: address as `0x${string}`,
      });
      await client.waitForTransactionReceipt({ hash: tx });

      // Reset input field after successful bet
      if (side === "yes") {
        setYesAmount("");
      } else {
        setNoAmount("");
      }
    } catch (error) {
      console.error("Error placing bet:", error);
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
            disabled={!yesAmount || isNaN(Number(yesAmount))}
            onClick={() => handleBet(Number(yesAmount), "yes", marketAddress)}
          >
            Bet on YES <ArrowRight className="ml-2 w-4 h-4" />
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
            disabled={!noAmount || isNaN(Number(noAmount))}
            onClick={() => handleBet(Number(noAmount), "no", marketAddress)}
          >
            Bet on NO <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="bg-gray-800 rounded-lg pixelated-border p-6 sticky top-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-pixel mb-4">Place Your Bet</h3>

        {!isDisabled && (
          <USDCBalance usdcAddress={usdcAddress} address={address || ""} />
        )}
      </div>

      {isDisabled ? (
        <div className="bg-gray-700 p-4 rounded-lg font-mono text-center mb-4 mt-8 text-lg">
          This market is no longer accepting bets
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <h4 className="font-pixel text-sm mb-2">Select Chain</h4>
            <Tabs defaultValue="chainA" onValueChange={setSelectedChain}>
              <TabsList className="grid grid-cols-3 mb-4 p-1 bg-gray-700 rounded-lg">
                {Object.entries(chainData).map(([key, chain]) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="font-pixel data-[state=active]:bg-gray-600 data-[state=active]:shadow-inner transition-all duration-200"
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-4 h-4 ${chain.color} flex items-center justify-center text-black text-xs mr-2 rounded-sm`}
                      >
                        {chain.icon}
                      </div>
                      <span className="hidden sm:inline">{chain.name}</span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.keys(chainData).map((key) => (
                <TabsContent key={key} value={key}>
                  <div className="bg-gray-700 p-3 rounded-lg mb-4">
                    <div className="flex items-center font-mono text-sm">
                      <div
                        className={`w-5 h-5 ${
                          chainData[key as keyof typeof chainData].color
                        } flex items-center justify-center text-black text-xs mr-2 rounded-sm`}
                      >
                        {chainData[key as keyof typeof chainData].icon}
                      </div>
                      <span>
                        Betting on{" "}
                        {chainData[key as keyof typeof chainData].name} Network
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg mb-4">
                    <MintandApprove
                      address={address || ""}
                      usdcAddress={usdcAddress}
                      marketAddress={marketAddress}
                    />
                  </div>
                  <BettingForm />
                </TabsContent>
              ))}
            </Tabs>
          </div>
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
