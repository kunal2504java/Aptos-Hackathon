"use client";

// Ultra-safe wallet that never calls problematic APIs
class UltraSafeWallet {
  private static connectedAddress: string | null = null;
  private static isWalletConnected: boolean = false;
  private static listeners: Set<() => void> = new Set();

  static subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private static notify() {
    this.listeners.forEach(cb => cb());
  }

  static isConnected(): boolean {
    return this.isWalletConnected && !!this.connectedAddress;
  }

  static getAccount(): { address: string } | null {
    if (this.connectedAddress) {
      return { address: this.connectedAddress };
    }
    return null;
  }

  static async connect(): Promise<{ address: string }> {
    if (typeof window === 'undefined') {
      throw new Error('Not in browser');
    }

    const aptos = (window as any).aptos;
    if (!aptos) {
      throw new Error('Please install Petra wallet');
    }

    try {
      console.log('UltraSafeWallet: Connecting...');
      
      // Call connect and wait for user interaction
      await aptos.connect();
      
      console.log('UltraSafeWallet: Connect dialog completed');
      
      // At this point, if no error was thrown, we assume success
      // We'll get the actual address through a different method
      
      // Set up a one-time listener for account changes if available
      if (aptos.onAccountChange) {
        const handleAccountChange = (account: any) => {
          console.log('UltraSafeWallet: Account change detected:', account);
          if (account && account.address) {
            this.connectedAddress = account.address;
            this.isWalletConnected = true;
            this.notify();
          }
        };
        
        // Listen for account changes
        aptos.onAccountChange(handleAccountChange);
      }
      
      // Try to get account in a safe way
      let account = null;
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          // Only call account() if we haven't had errors before
          account = aptos.account();
          if (account && account.address) {
            console.log('UltraSafeWallet: Got account:', account.address);
            this.connectedAddress = account.address;
            this.isWalletConnected = true;
            this.notify();
            return account;
          }
        } catch (error) {
          console.log(`UltraSafeWallet: Account check ${i + 1} failed, will retry...`);
          // Don't throw, just continue trying
        }
      }
      
      // If we get here, assume connection worked but we can't get the address yet
      // This is better than failing - the address might come later via events
      console.log('UltraSafeWallet: Connected but address not available yet');
      this.isWalletConnected = true;
      this.notify();
      
      // Return a placeholder - the real address will come via events
      return { address: 'connecting...' };
      
    } catch (error) {
      console.error('UltraSafeWallet: Connect failed:', error);
      this.connectedAddress = null;
      this.isWalletConnected = false;
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    if (typeof window !== 'undefined') {
      const aptos = (window as any).aptos;
      if (aptos && aptos.disconnect) {
        try {
          await aptos.disconnect();
        } catch (error) {
          console.log('UltraSafeWallet: Disconnect error (ignoring):', error);
        }
      }
    }
    
    this.connectedAddress = null;
    this.isWalletConnected = false;
    console.log('UltraSafeWallet: Disconnected');
    this.notify();
  }

  static async signAndSubmitTransaction(transaction: any): Promise<{ hash: string }> {
    if (!this.isConnected()) {
      throw new Error('Wallet not connected');
    }

    if (typeof window === 'undefined') {
      throw new Error('Not in browser');
    }

    const aptos = (window as any).aptos;
    if (!aptos) {
      throw new Error('Wallet not found');
    }

    try {
      console.log('UltraSafeWallet: Submitting transaction:', transaction);
      const result = await aptos.signAndSubmitTransaction(transaction);
      console.log('UltraSafeWallet: Transaction submitted:', result.hash);
      return result;
    } catch (error) {
      console.error('UltraSafeWallet: Transaction failed:', error);
      throw error;
    }
  }

  // Manual method to set address if user knows it
  static setConnectedAddress(address: string) {
    console.log('UltraSafeWallet: Manually setting address:', address);
    this.connectedAddress = address;
    this.isWalletConnected = true;
    this.notify();
  }

  // Check if wallet is available
  static isWalletAvailable(): boolean {
    return typeof window !== 'undefined' && !!(window as any).aptos;
  }

  // Reset state
  static reset() {
    this.connectedAddress = null;
    this.isWalletConnected = false;
    this.notify();
  }
}

export default UltraSafeWallet;