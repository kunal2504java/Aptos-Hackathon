"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";

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

export default function ConnectButton() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<{ address: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if wallet is already connected
    if (window.aptos?.isConnected()) {
      setConnected(true);
      setAccount(window.aptos?.account() || null);
    }
  }, []);

  const handleConnect = async () => {
    if (!window.aptos) {
      alert("Please install Petra wallet or another Aptos wallet");
      return;
    }

    setLoading(true);
    try {
      await window.aptos.connect();
      setConnected(true);
      setAccount(window.aptos.account());
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      alert("Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.aptos) return;

    setLoading(true);
    try {
      await window.aptos.disconnect();
      setConnected(false);
      setAccount(null);
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  if (connected && account) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-green-800 dark:text-green-200">
            {account.address.slice(0, 6)}...{account.address.slice(-4)}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          disabled={loading}
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
      disabled={loading}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
    >
      <Wallet className="w-4 h-4" />
      {loading ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
}
