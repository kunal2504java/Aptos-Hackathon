"use client";

import { useWallet, debugWalletConnection } from "@/lib/wallet-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WalletDebug() {
  const { account, connected, connecting, signAndSubmitTransaction } = useWallet();

  const handleDebugWallet = () => {
    console.log('=== WALLET DEBUG INFO ===');
    debugWalletConnection();
    console.log('Connected:', connected);
    console.log('Connecting:', connecting);
    console.log('Account:', account);
    console.log('Window object:', typeof window !== 'undefined' ? 'Available' : 'Not available');
    console.log('Petra object:', typeof window !== 'undefined' ? !!(window as any).aptos : 'N/A');
    console.log('========================');
  };

  const handleTestTransaction = async () => {
    try {
      console.log('Testing transaction...');
      
      // Simple test transaction payload
      const testPayload = {
        type: "entry_function_payload",
        function: "0x1::coin::transfer",
        arguments: [account?.address, "1"], // Transfer 1 unit to self
        type_arguments: ["0x1::aptos_coin::AptosCoin"],
      };

      console.log('Test payload:', testPayload);
      
      // This will help us see what error we get
      await signAndSubmitTransaction(testPayload);
      
    } catch (error) {
      console.error('Test transaction failed:', error);
      alert(`Test transaction failed: ${error}`);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center">
          Wallet Debug Panel
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Connected:</span>
            <span className={`ml-2 ${connected ? 'text-green-400' : 'text-red-400'}`}>
              {connected ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="font-semibold">Connecting:</span>
            <span className={`ml-2 ${connecting ? 'text-yellow-400' : 'text-gray-400'}`}>
              {connecting ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="font-semibold">Account:</span>
            <span className="ml-2 text-gray-400">
              {account ? `${account.address.slice(0, 8)}...` : 'None'}
            </span>
          </div>
          <div>
            <span className="font-semibold">Petra Available:</span>
            <span className={`ml-2 ${typeof window !== 'undefined' && (window as any).aptos ? 'text-green-400' : 'text-red-400'}`}>
              {typeof window !== 'undefined' && (window as any).aptos ? 'Yes' : 'No'}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleDebugWallet}
            variant="outline"
            className="flex-1"
          >
            Debug Wallet
          </Button>
          <Button
            onClick={handleTestTransaction}
            disabled={!connected || !account}
            variant="outline"
            className="flex-1"
          >
            Test Transaction
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          <p>Check the browser console for detailed debug information.</p>
          <p>This will help identify the cause of the "Generic error".</p>
        </div>
      </CardContent>
    </Card>
  );
}