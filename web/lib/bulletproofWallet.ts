"use client";

// Bulletproof wallet that definitely works
class BulletproofWallet {
  private static connectedAddress: string | null = null;
  private static listeners: Set<() => void> = new Set();

  static subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private static notify() {
    this.listeners.forEach(cb => cb());
  }

  static isConnected(): boolean {
    // Check our internal state first
    if (this.connectedAddress) {
      return true;
    }

    // Try to get fresh wallet state without calling problematic APIs
    if (typeof window !== 'undefined') {
      const aptos = (window as any).aptos;
      if (aptos) {
        try {
          // Try to get account directly without calling isConnected()
          const account = aptos.account();
          if (account && account.address) {
            this.connectedAddress = account.address;
            console.log('BulletproofWallet: Found connected wallet:', account.address);
            return true;
          }
        } catch {
          // If account() fails, wallet is not connected
          this.connectedAddress = null;
        }
      }
    }

    return false;
  }

  static getAccount(): { address: string } | null {
    // Return cached address if we have it
    if (this.connectedAddress) {
      return { address: this.connectedAddress };
    }

    // Try to get fresh account
    if (typeof window !== 'undefined') {
      const aptos = (window as any).aptos;
      if (aptos) {
        try {
          const account = aptos.account();
          if (account && account.address) {
            this.connectedAddress = account.address;
            return account;
          }
        } catch {
          this.connectedAddress = null;
        }
      }
    }

    return null;
  }

  static async connect(): Promise<{ address: string } | null> {
    if (typeof window === 'undefined') {
      throw new Error('Not in browser');
    }

    const aptos = (window as any).aptos;
    if (!aptos) {
      throw new Error('Please install Petra wallet');
    }

    try {
      console.log('BulletproofWallet: Connecting...');
      
      // Force connect
      await aptos.connect();
      
      console.log('BulletproofWallet: Connect call completed, waiting for account...');
      
      // Wait and retry getting account multiple times
      let account = null;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!account && attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 200 * attempts)); // Increasing delay
        
        try {
          account = aptos.account();
          console.log(`BulletproofWallet: Attempt ${attempts}, account:`, account);
          
          if (account && account.address) {
            this.connectedAddress = account.address;
            console.log('BulletproofWallet: Successfully connected to:', account.address);
            this.notify();
            return account;
          }
        } catch (error) {
          console.log(`BulletproofWallet: Attempt ${attempts} failed:`, error);
        }
      }
      
      // If we get here, all attempts failed
      throw new Error(`No account found after connection (tried ${maxAttempts} times)`);
      
    } catch (error) {
      console.error('BulletproofWallet: Connect failed:', error);
      this.connectedAddress = null;
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    if (typeof window !== 'undefined') {
      const aptos = (window as any).aptos;
      if (aptos) {
        try {
          await aptos.disconnect();
        } catch (error) {
          console.log('Disconnect error (ignoring):', error);
        }
      }
    }
    
    this.connectedAddress = null;
    console.log('BulletproofWallet: Disconnected');
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
      console.log('BulletproofWallet: Submitting transaction:', transaction);
      const result = await aptos.signAndSubmitTransaction(transaction);
      console.log('BulletproofWallet: Transaction submitted:', result.hash);
      return result;
    } catch (error) {
      console.error('BulletproofWallet: Transaction failed:', error);
      throw error;
    }
  }

  // Force refresh wallet state
  static refresh() {
    console.log('BulletproofWallet: Refreshing state...');
    const wasConnected = !!this.connectedAddress;
    const isNowConnected = this.isConnected();
    
    if (wasConnected !== isNowConnected) {
      this.notify();
    }
  }

  // Simple connect that just calls connect() and assumes success
  static async simpleConnect(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('Not in browser');
    }

    const aptos = (window as any).aptos;
    if (!aptos) {
      throw new Error('Please install Petra wallet');
    }

    try {
      console.log('BulletproofWallet: Simple connect...');
      await aptos.connect();
      console.log('BulletproofWallet: Connect completed - wallet should be connected');
      
      // Don't try to get account immediately, let the periodic refresh handle it
      setTimeout(() => {
        this.refresh();
      }, 1000);
      
    } catch (error) {
      console.error('BulletproofWallet: Simple connect failed:', error);
      throw error;
    }
  }
}

export default BulletproofWallet;