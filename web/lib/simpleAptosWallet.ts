"use client";

// Simple, direct wallet integration that definitely works
export class SimpleAptosWallet {
  
  static isConnected(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const aptos = (window as any).aptos;
      if (!aptos) {
        console.log('SimpleAptosWallet: window.aptos not found');
        return false;
      }
      
      let isConnectedResult = false;
      let account = null;
      
      // Safely check isConnected with individual try-catch
      try {
        if (typeof aptos.isConnected === 'function') {
          isConnectedResult = aptos.isConnected();
        }
      } catch (error) {
        console.warn('Error calling aptos.isConnected():', error);
        isConnectedResult = false;
      }
      
      // Safely check account with individual try-catch
      try {
        if (typeof aptos.account === 'function') {
          account = aptos.account();
        }
      } catch (error) {
        console.warn('Error calling aptos.account():', error);
        account = null;
      }
      
      const hasAccount = account && account.address;
      
      console.log('SimpleAptosWallet.isConnected():', {
        aptosExists: !!aptos,
        isConnectedResult,
        hasAccount,
        account: account?.address?.slice(0, 10) || 'none'
      });
      
      // Return true if we have an account (most reliable indicator)
      return !!hasAccount;
      
    } catch (error) {
      console.error('SimpleAptosWallet.isConnected() outer error:', error);
      return false;
    }
  }
  
  static getAccount(): { address: string } | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const aptos = (window as any).aptos;
      if (!aptos) {
        console.log('SimpleAptosWallet.getAccount(): window.aptos not found');
        return null;
      }
      
      let account = null;
      
      // Safely get account with try-catch
      try {
        if (typeof aptos.account === 'function') {
          account = aptos.account();
        }
      } catch (error) {
        console.warn('Error calling aptos.account() in getAccount:', error);
        return null;
      }
      
      console.log('SimpleAptosWallet.getAccount():', account);
      return account;
      
    } catch (error) {
      console.error('SimpleAptosWallet.getAccount() outer error:', error);
      return null;
    }
  }
  
  static async connect(): Promise<{ address: string } | null> {
    if (typeof window === 'undefined') return null;
    
    const aptos = (window as any).aptos;
    if (!aptos) {
      throw new Error('Please install Petra wallet');
    }
    
    try {
      console.log('SimpleAptosWallet: Attempting to connect...');
      await aptos.connect();
      
      // Safely get account after connection
      try {
        const account = aptos.account();
        console.log('SimpleAptosWallet: Connected successfully:', account);
        return account;
      } catch (accountError) {
        console.warn('Error getting account after connect:', accountError);
        return null;
      }
    } catch (error) {
      console.error('Connect error:', error);
      throw new Error(`Failed to connect: ${error}`);
    }
  }
  
  static async disconnect(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const aptos = (window as any).aptos;
    if (aptos) {
      try {
        await aptos.disconnect();
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
  }
  
  static async signAndSubmitTransaction(transaction: any): Promise<{ hash: string }> {
    if (typeof window === 'undefined') {
      throw new Error('Window not available');
    }
    
    const aptos = (window as any).aptos;
    if (!aptos) {
      throw new Error('Wallet not found');
    }
    
    if (!this.isConnected()) {
      throw new Error('Wallet not connected');
    }
    
    try {
      return await aptos.signAndSubmitTransaction(transaction);
    } catch (error) {
      throw new Error(`Transaction failed: ${error}`);
    }
  }
}