"use client";

import { aptosClient, MODULE_NAMES } from "@/lib/aptos-client";
import React, { useEffect, useState, useCallback } from "react";

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

const AptosUSDCBalance = () => {
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const fetchBalance = useCallback(async () => {
    if (!account || !connected) {
      setBalance(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call the balance_of function from our MockUSDC contract
      const payload = {
        function: `${MODULE_NAMES.MOCK_USDC}::balance_of`,
        arguments: [account.address],
      };

      const response = await aptosClient.view({
        payload,
      });

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
    <div className="flex items-center gap-2">
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
        MockUSDC Balance:
      </div>
      <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
        {balance.toFixed(2)} MUSDC
      </div>
    </div>
  );
};

export default AptosUSDCBalance;
