"use client";

import { Button } from "@/components/ui/button";
import { Wallet, LogOut, AlertCircle } from "lucide-react";
import { useWallet, useWalletDetection } from "@/lib/wallet-context";

export default function ConnectButton() {
  const { account, connected, connecting, connect, disconnect } = useWallet();
  const { walletInstalled, walletName } = useWalletDetection();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      alert("Failed to connect wallet: " + (error as Error).message);
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
      <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-700">
            {walletName || 'Petra'}
          </span>
          <span className="text-xs font-mono text-gray-500">
            {account.address.slice(0, 6)}...{account.address.slice(-4)}
          </span>
        </div>
        <Button
          onClick={handleDisconnect}
          className="btn-danger-light"
          size="sm"
        >
          <LogOut className="w-4 h-4 mr-1" />
          Disconnect
        </Button>
      </div>
    );
  }

  if (!walletInstalled) {
    return (
      <div className="flex items-center gap-2">
        <Button
          onClick={() => window.open('https://petra.app/', '_blank')}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white"
        >
          <AlertCircle className="w-4 h-4" />
          Install Petra Wallet
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={connecting}
      className="btn-primary"
    >
      <Wallet className="w-4 h-4 mr-2" />
      {connecting ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
}
