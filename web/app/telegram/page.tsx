"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { aptosClient, MODULE_NAMES } from "@/lib/aptos-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, Wallet } from "lucide-react";

interface AptosWallet {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  account(): { address: string } | null;
  isConnected(): boolean;
  signAndSubmitTransaction(payload: any): Promise<{ hash: string }>;
}

declare global {
  interface Window {
    aptos?: AptosWallet;
  }
}

export default function TelegramWalletConnector() {
  const searchParams = useSearchParams();
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const userId = searchParams.get('user');
  const action = searchParams.get('action');
  const marketId = searchParams.get('market');
  const side = searchParams.get('side');
  const amount = searchParams.get('amount');
  const question = searchParams.get('question');
  const endDate = searchParams.get('endDate');

  useEffect(() => {
    // Check if wallet is already connected
    if (window.aptos?.isConnected()) {
      setConnected(true);
      setAddress(window.aptos?.account()?.address || null);
    }
  }, []);

  const handleConnect = async () => {
    if (!window.aptos) {
      setError("Please install Petra wallet or another Aptos wallet");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await window.aptos.connect();
      const account = window.aptos.account();
      
      if (account) {
        setConnected(true);
        setAddress(account.address);
        
        // Notify Telegram bot about successful connection
        if (userId) {
          await fetch('/api/telegram/webhook', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          
          // Send connection notification to Telegram
          await fetch('/api/telegram/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: parseInt(userId),
              message: `✅ Wallet connected successfully!\n\nAddress: ${account.address.slice(0, 6)}...${account.address.slice(-4)}\n\nYou can now place bets using Telegram commands.`,
            }),
          });
        }
        
        setSuccess(true);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setError("Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleBet = async () => {
    if (!window.aptos || !marketId || !side || !amount) return;

    setLoading(true);
    setError(null);

    try {
      const isYesToken = side.toLowerCase() === 'yes';
      const amountInSmallestUnit = Math.floor(parseFloat(amount) * Math.pow(10, 6));

      const payload = {
        type: "entry_function_payload",
        function: `${MODULE_NAMES.PREDICTION_MARKET}::buy_tokens`,
        arguments: [parseInt(marketId), isYesToken, amountInSmallestUnit],
        type_arguments: [],
      };

      const response = await window.aptos.signAndSubmitTransaction(payload);
      await aptosClient.waitForTransaction({ transactionHash: response.hash });

      // Notify Telegram bot about successful bet
      if (userId) {
        await fetch('/api/telegram/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: parseInt(userId),
            message: `🎲 Bet placed successfully!\n\nMarket ID: ${marketId}\nSide: ${side.toUpperCase()}\nAmount: ${amount} MockUSDC\n\nTransaction: ${response.hash}`,
          }),
        });
      }

      setSuccess(true);
    } catch (error) {
      console.error("Error placing bet:", error);
      setError("Failed to place bet");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMarket = async () => {
    if (!window.aptos || !question || !endDate) return;

    setLoading(true);
    setError(null);

    try {
      const endTimeTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

      const payload = {
        type: "entry_function_payload",
        function: `${MODULE_NAMES.PREDICTION_MARKET}::create_market`,
        arguments: [question, endTimeTimestamp],
        type_arguments: [],
      };

      const response = await window.aptos.signAndSubmitTransaction(payload);
      await aptosClient.waitForTransaction({ transactionHash: response.hash });

      // Notify Telegram bot about successful market creation
      if (userId) {
        await fetch('/api/telegram/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: parseInt(userId),
            message: `➕ Market created successfully!\n\nQuestion: ${question}\nEnd Date: ${endDate}\n\nTransaction: ${response.hash}`,
          }),
        });
      }

      setSuccess(true);
    } catch (error) {
      console.error("Error creating market:", error);
      setError("Failed to create market");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
              Success!
            </h2>
            <p className="text-green-600 dark:text-green-300 mb-4">
              {action === 'bet' ? 'Bet placed successfully!' : 
               action === 'create' ? 'Market created successfully!' : 
               'Wallet connected successfully!'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You can close this window and return to Telegram.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Wallet className="w-6 h-6" />
            Telegram Wallet Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {action === 'bet' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Place Bet
              </h3>
              <div className="text-sm space-y-1">
                <div>Market ID: {marketId}</div>
                <div>Side: {side?.toUpperCase()}</div>
                <div>Amount: {amount} MockUSDC</div>
              </div>
            </div>
          )}

          {action === 'create' && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                Create Market
              </h3>
              <div className="text-sm space-y-1">
                <div>Question: {question}</div>
                <div>End Date: {endDate}</div>
              </div>
            </div>
          )}

          {!connected ? (
            <div className="space-y-4">
              <p className="text-center text-gray-600 dark:text-gray-400">
                Connect your Aptos wallet to continue with your Telegram request.
              </p>
              
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}

              <Button
                onClick={handleConnect}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-green-600 dark:text-green-400 text-sm">
                  ✅ Wallet Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
              </div>

              {action === 'bet' && (
                <Button
                  onClick={handleBet}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Placing Bet...
                    </>
                  ) : (
                    'Place Bet'
                  )}
                </Button>
              )}

              {action === 'create' && (
                <Button
                  onClick={handleCreateMarket}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Market...
                    </>
                  ) : (
                    'Create Market'
                  )}
                </Button>
              )}

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
