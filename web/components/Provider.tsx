"use client";

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { WalletProvider } from "@/lib/wallet-context";

export default function Provider({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        {children}
      </WalletProvider>
    </QueryClientProvider>
  );
}
