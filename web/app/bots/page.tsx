"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Bot, Twitter, MessageCircle, CheckCircle, XCircle } from 'lucide-react';

interface BotStatus {
  telegram: boolean;
  twitter: boolean;
  lastCheck: Date;
}

export default function BotTestingInterface() {
  const [botStatus, setBotStatus] = useState<BotStatus>({
    telegram: false,
    twitter: false,
    lastCheck: new Date()
  });
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  const checkBotStatus = async () => {
    setIsLoading(true);
    try {
      // Check Telegram bot status
      const telegramResponse = await fetch('/api/telegram/status');
      const telegramStatus = telegramResponse.ok;

      // Check Twitter bot status
      const twitterResponse = await fetch('/api/twitter/status');
      const twitterStatus = twitterResponse.ok;

      setBotStatus({
        telegram: telegramStatus,
        twitter: twitterStatus,
        lastCheck: new Date()
      });

      setTestResults(prev => [...prev, {
        timestamp: new Date(),
        type: 'status_check',
        telegram: telegramStatus,
        twitter: twitterStatus
      }]);
    } catch (error) {
      console.error('Error checking bot status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testTelegramCommand = async (command: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      });

      const result = await response.json();
      setTestResults(prev => [...prev, {
        timestamp: new Date(),
        type: 'telegram_test',
        command,
        result
      }]);
    } catch (error) {
      console.error('Error testing Telegram command:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testTwitterMention = async (mention: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/twitter/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mention }),
      });

      const result = await response.json();
      setTestResults(prev => [...prev, {
        timestamp: new Date(),
        type: 'twitter_test',
        mention,
        result
      }]);
    } catch (error) {
      console.error('Error testing Twitter mention:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Bot Testing Interface
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Test and monitor your Telegram and Twitter bot integrations
        </p>
      </div>

      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="status">Bot Status</TabsTrigger>
          <TabsTrigger value="telegram">Telegram Testing</TabsTrigger>
          <TabsTrigger value="twitter">Twitter Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Bot Status Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center justify-between p-4 border rounded">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    <span>Telegram Bot</span>
                  </div>
                  {botStatus.telegram ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between p-4 border rounded">
                  <div className="flex items-center gap-2">
                    <Twitter className="w-5 h-5" />
                    <span>Twitter Bot</span>
                  </div>
                  {botStatus.twitter ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Last checked: {botStatus.lastCheck.toLocaleString()}
              </div>
              
              <Button
                onClick={checkBotStatus}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Check Bot Status
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="telegram" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Telegram Bot Testing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => testTelegramCommand('/start')}
                  disabled={isLoading}
                  variant="outline"
                >
                  Test /start
                </Button>
                <Button
                  onClick={() => testTelegramCommand('/help')}
                  disabled={isLoading}
                  variant="outline"
                >
                  Test /help
                </Button>
                <Button
                  onClick={() => testTelegramCommand('/markets')}
                  disabled={isLoading}
                  variant="outline"
                >
                  Test /markets
                </Button>
                <Button
                  onClick={() => testTelegramCommand('/balance')}
                  disabled={isLoading}
                  variant="outline"
                >
                  Test /balance
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="custom-command">Custom Command</Label>
                <div className="flex gap-2">
                  <Input
                    id="custom-command"
                    placeholder="e.g., /bet 1 yes 10.5"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        testTelegramCommand(input.value);
                        input.value = '';
                      }
                    }}
                  />
                  <Button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      testTelegramCommand(input.value);
                      input.value = '';
                    }}
                    disabled={isLoading}
                  >
                    Test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="twitter" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Twitter Bot Testing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => testTwitterMention('@OmniBetsAptos markets')}
                  disabled={isLoading}
                  variant="outline"
                >
                  Test Markets
                </Button>
                <Button
                  onClick={() => testTwitterMention('@OmniBetsAptos help')}
                  disabled={isLoading}
                  variant="outline"
                >
                  Test Help
                </Button>
                <Button
                  onClick={() => testTwitterMention('@OmniBetsAptos bet 1 yes 10.5')}
                  disabled={isLoading}
                  variant="outline"
                >
                  Test Bet
                </Button>
                <Button
                  onClick={() => testTwitterMention('@OmniBetsAptos create "Test market" 2024-12-31')}
                  disabled={isLoading}
                  variant="outline"
                >
                  Test Create
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="custom-mention">Custom Mention</Label>
                <div className="flex gap-2">
                  <Input
                    id="custom-mention"
                    placeholder="e.g., @OmniBetsAptos markets"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        testTwitterMention(input.value);
                        input.value = '';
                      }
                    }}
                  />
                  <Button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      testTwitterMention(input.value);
                      input.value = '';
                    }}
                    disabled={isLoading}
                  >
                    Test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.slice(-10).reverse().map((result, index) => (
                <div key={index} className="p-3 border rounded text-sm">
                  <div className="font-medium">
                    {result.type === 'status_check' && 'Status Check'}
                    {result.type === 'telegram_test' && `Telegram: ${result.command}`}
                    {result.type === 'twitter_test' && `Twitter: ${result.mention}`}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {result.timestamp.toLocaleString()}
                  </div>
                  <div className="mt-1">
                    <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
