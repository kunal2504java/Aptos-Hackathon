"use client";

// Modern Aptos Wallet Standard API
interface AptosWalletAccount {
  address: string;
  publicKey?: string;
}

interface AptosWalletStandard {
  connect(): Promise<{ account: AptosWalletAccount }>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  account(): AptosWalletAccount | null;
  signAndSubmitTransaction(transaction: any): Promise<{ hash: string }>;
  signTransaction(transaction: any): Promise<any>;
  network(): string;
}

interface ModernAptosWallet {
  name: string;
  icon: string;
  url: string;
  provider: AptosWalletStandard;
}

// Detect available wallets using the modern API
export function getAptosWallets(): ModernAptosWallet[] {
  if (typeof window === 'undefined') return [];
  
  const wallets: ModernAptosWallet[] = [];
  
  // Check for Petra wallet (modern API)
  if ((window as any).aptos) {
    wallets.push({
      name: 'Petra',
      icon: '🪙',
      url: 'https://petra.app',
      provider: (window as any).aptos,
    });
  }
  
  // Check for Martian wallet
  if ((window as any).martian) {
    wallets.push({
      name: 'Martian',
      icon: '👽',
      url: 'https://martianwallet.xyz',
      provider: (window as any).martian,
    });
  }
  
  // Check for Pontem wallet
  if ((window as any).pontem) {
    wallets.push({
      name: 'Pontem',
      icon: '🌉',
      url: 'https://pontem.network',
      provider: (window as any).pontem,
    });
  }
  
  return wallets;
}

// Main wallet manager class
export class AptosWalletManager {
  private currentWallet: ModernAptosWallet | null = null;
  private listeners: Set<() => void> = new Set();
  
  constructor() {
    // Listen for account changes
    if (typeof window !== 'undefined') {
      this.setupEventListeners();
      // Check for already connected wallets on initialization
      this.initializeConnectedWallet();
    }
  }
  
  private setupEventListeners() {
    // Listen for account changes across different wallets
    if ((window as any).aptos?.onAccountChange) {
      (window as any).aptos.onAccountChange(() => {
        this.notifyListeners();
      });
    }
    
    if ((window as any).aptos?.onNetworkChange) {
      (window as any).aptos.onNetworkChange(() => {
        this.notifyListeners();
      });
    }
  }
  
  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
  
  private initializeConnectedWallet() {
    // Check if any wallet is already connected
    setTimeout(() => {
      const wallets = this.getAvailableWallets();
      
      for (const wallet of wallets) {
        try {
          if (wallet.provider.isConnected?.() && wallet.provider.account?.()) {
            console.log(`Found already connected wallet: ${wallet.name}`);
            this.currentWallet = wallet;
            this.notifyListeners();
            break;
          }
        } catch (error) {
          console.log(`Error checking wallet ${wallet.name}:`, error);
        }
      }
    }, 100); // Small delay to ensure wallet APIs are ready
  }
  
  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  public getAvailableWallets(): ModernAptosWallet[] {
    return getAptosWallets();
  }
  
  public async connect(walletName?: string): Promise<{ account: AptosWalletAccount }> {
    const wallets = this.getAvailableWallets();
    
    if (wallets.length === 0) {
      throw new Error('No Aptos wallets found. Please install Petra, Martian, or Pontem wallet.');
    }
    
    // Use specified wallet or default to first available
    const targetWallet = walletName 
      ? wallets.find(w => w.name.toLowerCase() === walletName.toLowerCase())
      : wallets[0];
    
    if (!targetWallet) {
      throw new Error(`Wallet ${walletName} not found`);
    }
    
    try {
      const result = await targetWallet.provider.connect();
      this.currentWallet = targetWallet;
      this.notifyListeners();
      return result;
    } catch (error) {
      console.error('Failed to connect to wallet:', error);
      throw error;
    }
  }
  
  public async disconnect(): Promise<void> {
    if (!this.currentWallet) return;
    
    try {
      await this.currentWallet.provider.disconnect();
      this.currentWallet = null;
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
    }
  }
  
  public isConnected(): boolean {
    // Check if we have a current wallet and it's connected
    if (this.currentWallet?.provider.isConnected()) {
      return true;
    }
    
    // Fallback: check if any wallet is connected directly
    if (typeof window !== 'undefined') {
      // Check Petra/Aptos wallet
      if ((window as any).aptos?.isConnected?.()) {
        // If wallet is connected but we don't have it set as current, reconnect
        const wallets = this.getAvailableWallets();
        const aptosWallet = wallets.find(w => w.name === 'Petra');
        if (aptosWallet) {
          this.currentWallet = aptosWallet;
          return true;
        }
      }
    }
    
    return false;
  }
  
  public getAccount(): AptosWalletAccount | null {
    // First try current wallet
    if (this.currentWallet?.provider.account) {
      return this.currentWallet.provider.account();
    }
    
    // Fallback: check if any wallet has an account
    if (typeof window !== 'undefined') {
      if ((window as any).aptos?.account?.()) {
        const account = (window as any).aptos.account();
        // If we found an account but don't have current wallet set, set it
        if (account && !this.currentWallet) {
          const wallets = this.getAvailableWallets();
          const aptosWallet = wallets.find(w => w.name === 'Petra');
          if (aptosWallet) {
            this.currentWallet = aptosWallet;
          }
        }
        return account;
      }
    }
    
    return null;
  }
  
  public getCurrentWallet(): ModernAptosWallet | null {
    return this.currentWallet;
  }
  
  public async signAndSubmitTransaction(transaction: any): Promise<{ hash: string }> {
    if (!this.currentWallet) {
      throw new Error('No wallet connected');
    }
    
    return this.currentWallet.provider.signAndSubmitTransaction(transaction);
  }
  
  public async signTransaction(transaction: any): Promise<any> {
    if (!this.currentWallet) {
      throw new Error('No wallet connected');
    }
    
    return this.currentWallet.provider.signTransaction(transaction);
  }
  
  public getNetwork(): string {
    if (!this.currentWallet) return 'Unknown';
    
    try {
      return this.currentWallet.provider.network?.() || 'testnet';
    } catch {
      return 'testnet';
    }
  }
}

// Global wallet manager instance
export const walletManager = new AptosWalletManager();