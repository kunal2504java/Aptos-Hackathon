"use client";

import React from "react";
import {
  AptosWalletAdapterProvider,
  NetworkName,
} from "@aptos-labs/wallet-adapter-react";

// Define wallet plugins - we'll start with a basic setup
const wallets: any[] = [];

interface AptosWalletProviderProps {
  children: React.ReactNode;
}

export function AptosWalletProvider({ children }: AptosWalletProviderProps) {
  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      autoConnect={true}
      optInWallets={["Petra Wallet", "Pontem Wallet", "Martian Wallet"]}
      dappConfig={{
        network: NetworkName.Testnet,
        aptosApiKey: process.env.NEXT_PUBLIC_APTOS_API_KEY,
      }}
      onError={(error) => {
        console.error("Wallet connection error:", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}