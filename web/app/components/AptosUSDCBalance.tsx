"use client";

import { aptosClient, MODULE_NAMES } from "@/lib/aptos-client";
import React, { useEffect, useState, useCallback } from "react";
import { useWallet } from "@/lib/wallet-context";
import { Button } from "@/components/ui/button";
import { Loader2, Coins } from "lucide-react";

const AptosUSDCBalance = () => {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInitializeMockUSDC = async () => {
    if (!account) return;

    setIsMinting(true);
    try {
      const payload = {
        type: "entry_function_payload",
        function: `${MODULE_NAMES.MOCK_USDC}::initialize`,
        arguments: [],
        type_arguments: [],
      };

      console.log("Initializing MockUSDC:", payload);

      const response = await signAndSubmitTransaction(payload);
      await aptosClient.waitForTransaction({ transactionHash: response.hash });

      alert("MockUSDC initialized successfully!");
    } catch (error) {
      console.error("Error initializing MockUSDC:", error);
      alert("Failed to initialize MockUSDC. Please try again.");
    } finally {
      setIsMinting(false);
    }
  };

  const handleMintTokens = async () => {
    if (!account) return;

    setIsMinting(true);
    try {
      const mintAmount = 1000000000; // 1000 MockUSDC (6 decimals)
      
      const payload = {
        type: "entry_function_payload",
        function: `${MODULE_NAMES.MOCK_USDC}::mint`,
        arguments: [account.address, mintAmount],
        type_arguments: [],
      };

      console.log("Minting MockUSDC tokens:", payload);

      const response = await signAndSubmitTransaction(payload);
      await aptosClient.waitForTransaction({ transactionHash: response.hash });

      // Refresh balance after successful mint
      await fetchBalance();
      alert("Successfully minted 1000 MockUSDC tokens!");
    } catch (error) {
      console.error("Error minting tokens:", error);
      alert("Failed to mint tokens. Please try again.");
    } finally {
      setIsMinting(false);
    }
  };

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

  const fetchBalance = useCallback(async () => {
    if (!account || !connected) {
      setBalance(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Fetching MockUSDC balance for:", account.address);

      const response = await callViewFunction(`${MODULE_NAMES.MOCK_USDC}::balance_of`, [account.address]);

      // Convert from smallest unit to display unit (6 decimals for MockUSDC)
      const balanceValue = Number(response[0]) / Math.pow(10, 6);
      setBalance(balanceValue);
    } catch (error) {
      console.error("Error fetching MockUSDC balance:", error);
      setError("Failed to load balance");
    } finally {
      setIsLoading(false);
    }
  }, [account, connected]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  if (!connected) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Connect wallet to view balance
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Loading balance...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200">
      <div className="flex items-center gap-2">
        <Coins className="w-4 h-4 text-blue-600" />
        <div className="text-sm font-medium text-gray-700">
          MockUSDC Balance:
        </div>
        <div className="text-blue-600 font-bold text-lg">
          {balance.toFixed(2)} MUSDC
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={handleInitializeMockUSDC}
          disabled={isMinting}
          size="sm"
          className="btn-init"
        >
          {isMinting ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Init...
            </>
          ) : (
            "Init"
          )}
        </Button>
        <Button
          onClick={handleMintTokens}
          disabled={isMinting}
          size="sm"
          className="btn-mint"
        >
          {isMinting ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Mint...
            </>
          ) : (
            <>
              <Coins className="w-3 h-3 mr-1" />
              Mint
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AptosUSDCBalance;
