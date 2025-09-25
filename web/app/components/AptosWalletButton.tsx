"use client";

import React from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";

export function AptosWalletButton() {
  const { connected, account, connect, disconnect, wallet } = useWallet();

  const handleConnect = async () => {
    try {
      // Try to connect to any available wallet
      await connect();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  if (connected && account) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-sm text-gray-300">
          {account.address?.slice(0, 6)}...{account.address?.slice(-4)}
        </div>
        <Button
          onClick={handleDisconnect}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      className="flex items-center gap-2"
      variant="default"
    >
      <Wallet className="w-4 h-4" />
      Connect Wallet
    </Button>
  );
}

// Hook for using wallet in other components
export function useAptosWallet() {
  const wallet = useWallet();
  
  return {
    ...wallet,
    address: wallet.account?.address,
    isConnected: wallet.connected,
  };
}