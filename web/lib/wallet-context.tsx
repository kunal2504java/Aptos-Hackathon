"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";

// Wallet interface
interface WalletAccount {
  address: string;
  publicKey?: string;
}

interface WalletContextType {
  account: WalletAccount | null;
  connected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signAndSubmitTransaction: (transaction: any) => Promise<{ hash: string }>;
}

// Create wallet context
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Wallet provider component
export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Check for wallet on mount
  useEffect(() => {
    checkWalletConnection();
    
    // Listen for wallet changes
    const handleAccountsChanged = () => {
      checkWalletConnection();
    };

    // Listen for wallet events
    if (typeof window !== 'undefined') {
      window.addEventListener('aptos:accountsChanged', handleAccountsChanged);
      window.addEventListener('aptos:networkChanged', handleAccountsChanged);
      
      return () => {
        window.removeEventListener('aptos:accountsChanged', handleAccountsChanged);
        window.removeEventListener('aptos:networkChanged', handleAccountsChanged);
      };
    }
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window === 'undefined') return;

    try {
      const aptos = (window as any).aptos;
      if (!aptos) {
        setConnected(false);
        setAccount(null);
        return;
      }

      // Check if wallet is connected
      const isConnected = await aptos.isConnected();
      if (isConnected) {
        const accountInfo = await aptos.account();
        if (accountInfo?.address) {
          setAccount({ address: accountInfo.address });
          setConnected(true);
        } else {
          setConnected(false);
          setAccount(null);
        }
      } else {
        setConnected(false);
        setAccount(null);
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      setConnected(false);
      setAccount(null);
    }
  };

  const connect = async () => {
    if (typeof window === 'undefined') {
      throw new Error('Not in browser environment');
    }

    const aptos = (window as any).aptos;
    if (!aptos) {
      throw new Error('Petra wallet not found. Please install the Petra wallet extension.');
    }

    setConnecting(true);
    try {
      console.log('Connecting to wallet...');
      
      // Connect to wallet
      await aptos.connect();
      
      // Get account info
      const accountInfo = await aptos.account();
      if (!accountInfo?.address) {
        throw new Error('Failed to get account information');
      }

      setAccount({ address: accountInfo.address });
      setConnected(true);
      
      console.log('Wallet connected successfully:', accountInfo.address);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setConnected(false);
      setAccount(null);
      throw error;
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    if (typeof window !== 'undefined') {
      const aptos = (window as any).aptos;
      if (aptos?.disconnect) {
        try {
          await aptos.disconnect();
        } catch (error) {
          console.error('Error disconnecting wallet:', error);
        }
      }
    }

    setConnected(false);
    setAccount(null);
    console.log('Wallet disconnected');
  };

  const signAndSubmitTransaction = async (transaction: any) => {
    if (!connected || !account) {
      throw new Error('Wallet not connected');
    }

    if (typeof window === 'undefined') {
      throw new Error('Not in browser environment');
    }

    const aptos = (window as any).aptos;
    if (!aptos) {
      throw new Error('Petra wallet not found');
    }

    try {
      console.log('Signing and submitting transaction...');
      console.log('Transaction payload:', JSON.stringify(transaction, null, 2));
      
      // Validate transaction payload
      if (!transaction.type || !transaction.function) {
        throw new Error('Invalid transaction payload: missing type or function');
      }
      
      // Use the new API format to avoid deprecation warning
      const result = await aptos.signAndSubmitTransaction({ payload: transaction });
      console.log('Transaction successful:', result.hash);
      return result;
    } catch (error: any) {
      console.error('Transaction failed:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('User rejected')) {
        throw new Error('Transaction was rejected by user');
      } else if (error.message?.includes('Insufficient')) {
        throw new Error('Insufficient balance for transaction');
      } else if (error.message?.includes('network')) {
        throw new Error('Network error. Please check your connection.');
      } else if (error.message?.includes('Generic error')) {
        throw new Error('Transaction failed. Please check your wallet connection and try again.');
      }
      
      throw error;
    }
  };

  const value: WalletContextType = {
    account,
    connected,
    connecting,
    connect,
    disconnect,
    signAndSubmitTransaction,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

// Hook to use wallet context
export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

// Wallet detection hook
export function useWalletDetection() {
  const [walletInstalled, setWalletInstalled] = useState(false);
  const [walletName, setWalletName] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkWallet = () => {
      const aptos = (window as any).aptos;
      if (aptos) {
        setWalletInstalled(true);
        // Try to detect wallet name
        if (aptos.name) {
          setWalletName(aptos.name);
        } else {
          setWalletName('Petra'); // Default assumption
        }
      } else {
        setWalletInstalled(false);
        setWalletName(null);
      }
    };

    checkWallet();

    // Listen for wallet installation
    const handleWalletInstalled = () => {
      checkWallet();
    };

    window.addEventListener('aptos:installed', handleWalletInstalled);
    
    return () => {
      window.removeEventListener('aptos:installed', handleWalletInstalled);
    };
  }, []);

  return { walletInstalled, walletName };
}

// Helper function to debug wallet connection
export function debugWalletConnection() {
  if (typeof window === 'undefined') {
    console.log('Not in browser environment');
    return;
  }

  const aptos = (window as any).aptos;
  console.log('Petra wallet available:', !!aptos);
  
  if (aptos) {
    console.log('Petra wallet object:', aptos);
    console.log('Available methods:', Object.keys(aptos));
  }
}
