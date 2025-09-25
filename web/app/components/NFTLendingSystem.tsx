'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/lib/wallet-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Coins, 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  DollarSign,
  Clock,
  Target
} from 'lucide-react';

interface NFT {
  id: string;
  name: string;
  description: string;
  image: string;
  rarity: string;
  type: string;
  metadata: any;
  estimatedValue: number;
}

interface NFTCollateral {
  nft_id: string;
  owner: string;
  market_id: number;
  bet_amount: number;
  collateral_value: number;
  loan_id: string;
  created_at: number;
  active: boolean;
}

interface Market {
  id: number;
  question: string;
  end_time: number;
  state: number;
  total_staked: number;
  total_yes: number;
  total_no: number;
}

export default function NFTLendingSystem() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [userNFTs, setUserNFTs] = useState<NFT[]>([]);
  const [activeMarkets, setActiveMarkets] = useState<Market[]>([]);
  const [userCollateral, setUserCollateral] = useState<NFTCollateral[]>([]);
  const [lendingStats, setLendingStats] = useState<{
    totalLent: number;
    totalRecovered: number;
    activeLoans: number;
    totalLoans: number;
  }>({ totalLent: 0, totalRecovered: 0, activeLoans: 0, totalLoans: 0 });
  
  const [selectedNFT, setSelectedNFT] = useState<string>('');
  const [selectedMarket, setSelectedMarket] = useState<string>('');
  const [betAmount, setBetAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Fetch user NFTs
  const fetchUserNFTs = async () => {
    if (!account?.address) return;
    
    try {
      console.log('Fetching user NFTs for address:', account.address);
      const response = await callViewFunction(
        `0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23::nft_rewards::get_user_nfts`,
        [account.address]
      );
      
      console.log('Raw NFT response:', response);
      
      if (response && Array.isArray(response)) {
        // The response is an array of NFT arrays, so we need to flatten it
        const allNFTs = response.flat();
        console.log('Flattened NFT array:', allNFTs);
        
        const nfts = allNFTs.map((nft: any, index: number) => {
          console.log(`NFT ${index}:`, nft);
          
          // Extract NFT ID - the blockchain returns binary format IDs
          // Check multiple possible ID fields
          let nftId = nft.id || nft.nft_id || nft.token_id || nft.name;
          
          // CRITICAL DEBUG: Check if the NFT object is being modified
          console.log(`NFT ${index} BEFORE processing - nft.id:`, nft.id);
          console.log(`NFT ${index} BEFORE processing - nft object:`, JSON.stringify(nft, null, 2));
          
          // Debug: Check if nft.id exists
          console.log(`NFT ${index} DIRECT nft.id check:`, nft.id);
          console.log(`NFT ${index} DIRECT nft.id type:`, typeof nft.id);
          console.log(`NFT ${index} DIRECT nft.id === undefined:`, nft.id === undefined);
          
          // Debug: Check all possible ID fields
          console.log(`NFT ${index} ALL ID FIELDS:`, {
            'nft.id': nft.id,
            'nft.nft_id': nft.nft_id,
            'nft.token_id': nft.token_id,
            'nft.name': nft.name,
            'nft[0]': nft[0],
            'nft[1]': nft[1]
          });
          
          console.log(`NFT ${index} raw NFT object:`, nft);
          console.log(`NFT ${index} raw NFT keys:`, Object.keys(nft));
          console.log(`NFT ${index} raw ID:`, nftId, 'type:', typeof nftId);
          console.log(`NFT ${index} nft.id:`, nft.id);
          console.log(`NFT ${index} nft.nft_id:`, nft.nft_id);
          console.log(`NFT ${index} nft.token_id:`, nft.token_id);
          console.log(`NFT ${index} nft.name:`, nft.name);
          
          // Convert to string if needed
          if (typeof nftId === 'object') {
            nftId = nftId.toString();
            console.log(`NFT ${index} converted ID:`, nftId);
          }
          
          // Check if ID is valid (not empty, not undefined, not null)
          // Binary IDs like 'win_badge_\x01\x00\x00\x00\x00\x00\x00\x00' are valid
          // Use more specific checks to avoid issues with binary data
          const isValidId = nftId !== null && 
                           nftId !== undefined && 
                           nftId !== 'undefined' && 
                           nftId !== 'null' && 
                           nftId !== '' &&
                           typeof nftId === 'string' &&
                           nftId.length > 0;
          
          if (!isValidId) {
            console.log(`NFT ${index} using fallback ID - invalid ID:`, nftId);
            console.log(`NFT ${index} ID validation failed:`, {
              isNull: nftId === null,
              isUndefined: nftId === undefined,
              isStringUndefined: nftId === 'undefined',
              isStringNull: nftId === 'null',
              isEmpty: nftId === '',
              isString: typeof nftId === 'string',
              length: nftId ? nftId.length : 'N/A'
            });
            nftId = `nft_${index}`;
          } else {
            console.log(`NFT ${index} using blockchain ID:`, nftId);
            console.log(`NFT ${index} ID length:`, nftId.length);
            console.log(`NFT ${index} ID first 20 chars:`, nftId.substring(0, 20));
          }
          
          console.log(`NFT ${index} ID extraction:`, {
            extractedId: nftId,
            originalId: nft.id,
            name: nft.name,
            idLength: nftId ? nftId.length : 0,
            idValid: !(!nftId || nftId === 'undefined' || nftId === 'null' || nftId === '')
          });
          
          // Debug: Check name field
          console.log(`NFT ${index} NAME DEBUG:`, {
            'nft.name': nft.name,
            'nft.name type': typeof nft.name,
            'nft.name === undefined': nft.name === undefined,
            'nft.name === null': nft.name === null,
            'nft.name === ""': nft.name === '',
            'nft.name length': nft.name ? nft.name.length : 'N/A'
          });
          
          const processedNFT = {
            id: nftId,
            name: nft.name || 'Unknown NFT',
            description: nft.description || 'No description',
            image: `https://picsum.photos/200/200?random=${index + 20}`,
            rarity: getRarityName(nft.rarity || 1),
            type: getTypeName(nft.nft_type || 1),
            metadata: nft.metadata || {},
            estimatedValue: calculateNFTValue(nft.nft_type || 1, nft.rarity || 1),
            rawData: nft // Keep raw data for debugging
          };
          
          console.log(`NFT ${index} final processed:`, processedNFT);
          
          // Verify the ID is correct
          if (processedNFT.id === `nft_${index}`) {
            console.error(`NFT ${index} ERROR: Using fallback ID instead of blockchain ID!`);
            console.error(`Original blockchain ID:`, nft.id);
          }
          
          return processedNFT;
        });
        console.log('Processed NFTs:', nfts);
        setUserNFTs(nfts);
      } else {
        console.log('No NFTs found or invalid response format');
        setUserNFTs([]);
      }
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      setUserNFTs([]);
    }
  };

  // Fetch active markets
  const fetchActiveMarkets = async () => {
    try {
      console.log('Fetching market count...');
      const countResponse = await callViewFunction(
        `0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23::prediction_market::get_market_count`,
        []
      );
      
      console.log('Market count response:', countResponse);
      let marketCount = 0;
      if (Array.isArray(countResponse) && countResponse.length > 0) {
        marketCount = Number(countResponse[0]);
      }
      
      console.log(`Found ${marketCount} markets on blockchain`);
      
      if (marketCount === 0) {
        console.log('No markets found on blockchain');
        setActiveMarkets([]);
        return;
      }
      
      const markets = [];
      // Fetch more markets to ensure we get active ones
      for (let i = 1; i <= Math.min(marketCount, 20); i++) {
        try {
          console.log(`Fetching market ${i}...`);
          const marketResponse = await callViewFunction(
            `0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23::prediction_market::get_market`,
            [i.toString()]
          );
          
          console.log(`Market ${i} response:`, marketResponse);
          let marketData = marketResponse;
          if (Array.isArray(marketResponse) && marketResponse.length > 0) {
            marketData = marketResponse[0];
          }
          
          if (marketData && marketData.state === 0) { // Active markets only
            markets.push({
              id: Number(marketData.id || i),
              question: marketData.question || 'Unknown Market',
              end_time: Number(marketData.end_time || 0),
              state: Number(marketData.state || 0),
              total_staked: Number(marketData.total_staked || 0),
              total_yes: Number(marketData.total_yes || 0),
              total_no: Number(marketData.total_no || 0),
            });
          }
        } catch (error) {
          console.error(`Error fetching market ${i}:`, error);
        }
      }
      
      console.log(`Found ${markets.length} active markets:`, markets);
      setActiveMarkets(markets);
      
    } catch (error) {
      console.error('Error fetching markets:', error);
      setActiveMarkets([]);
    }
  };

  // Fetch user collateral
  const fetchUserCollateral = async () => {
    if (!account?.address) return;
    
    try {
      console.log('=== FETCHING USER COLLATERAL ===');
      console.log('Account address:', account.address);
      
      const response = await callViewFunction(
        `0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23::nft_rewards::get_user_active_collateral`,
        [account.address]
      );
      
      console.log('Raw collateral response:', response);
      console.log('Response type:', typeof response);
      console.log('Response is array:', Array.isArray(response));
      console.log('Response length:', response?.length);
      
      if (response && Array.isArray(response) && response.length > 0) {
        console.log('Processing collateral data...');
        
        // Flatten the response in case it's nested arrays
        const flattenedResponse = response.flat();
        console.log('Flattened response:', flattenedResponse);
        
        // Process collateral data to ensure proper structure
        const processedCollateral = flattenedResponse.map((collateral: any, index: number) => {
          console.log(`Collateral ${index}:`, collateral);
          console.log(`Collateral ${index} type:`, typeof collateral);
          console.log(`Collateral ${index} is array:`, Array.isArray(collateral));
          console.log(`Collateral ${index} keys:`, Object.keys(collateral));
          console.log(`Collateral ${index} structure:`, {
            'collateral.loan_id': collateral.loan_id,
            'collateral.nft_id': collateral.nft_id,
            'collateral.market_id': collateral.market_id,
            'collateral.bet_amount': collateral.bet_amount,
            'collateral.collateral_value': collateral.collateral_value,
            'collateral.created_at': collateral.created_at,
            'collateral.status': collateral.status,
            'collateral.id': collateral.id,
            'collateral.market': collateral.market,
            'collateral.amount': collateral.amount,
            'collateral.value': collateral.value,
            'collateral.timestamp': collateral.timestamp
          });
          
          // Log specific field types
          if (collateral.nft_id) {
            console.log(`NFT ID type: ${typeof collateral.nft_id}, value:`, collateral.nft_id);
          }
          if (collateral.market_id) {
            console.log(`Market ID type: ${typeof collateral.market_id}, value:`, collateral.market_id);
          }
          
          // Handle case where collateral might be an array of values instead of an object
          let processedData;
          if (Array.isArray(collateral)) {
            // If collateral is an array, map it to the expected struct fields
            // Order: nft_id, owner, market_id, bet_amount, collateral_value, loan_id, created_at, active
            processedData = {
              loan_id: String(collateral[5] || `loan_${index}`),
              nft_id: String(collateral[0] || 'Unknown NFT'),
              market_id: String(collateral[2] || 'Unknown'),
              bet_amount: String(collateral[3] || '0'),
              collateral_value: String(collateral[4] || '0'),
              created_at: Number(collateral[6] || Date.now() / 1000),
              status: String(collateral[7] ? 'active' : 'inactive'),
              rawData: collateral
            };
          } else {
            // If collateral is an object, use the existing logic with better object handling
            const extractStringValue = (value: any): string => {
              if (typeof value === 'string') return value;
              if (typeof value === 'number') return String(value);
              if (typeof value === 'object' && value !== null) {
                // Try to extract meaningful data from object
                if (value.id) return String(value.id);
                if (value.name) return String(value.name);
                if (value.toString && typeof value.toString === 'function') {
                  const str = value.toString();
                  if (str !== '[object Object]') return str;
                }
                return 'Unknown';
              }
              return String(value || 'Unknown');
            };

            const extractNumberValue = (value: any): number => {
              if (typeof value === 'number') return value;
              if (typeof value === 'string') return Number(value) || 0;
              if (typeof value === 'object' && value !== null) {
                if (value.value !== undefined) return Number(value.value) || 0;
                if (value.amount !== undefined) return Number(value.amount) || 0;
              }
              return 0;
            };

            processedData = {
              loan_id: extractStringValue(collateral.loan_id || `loan_${index}`),
              nft_id: extractStringValue(collateral.nft_id || collateral.id || 'Unknown NFT'),
              market_id: extractStringValue(collateral.market_id || collateral.market || 'Unknown'),
              bet_amount: String(collateral.bet_amount || '0'),
              collateral_value: String(collateral.collateral_value || '0'),
              created_at: Number(collateral.created_at || Date.now() / 1000),
              status: collateral.active ? 'active' : 'inactive',
              rawData: collateral
            };
          }
          
          console.log(`Processed collateral ${index}:`, processedData);
          return processedData;
        });
        
        console.log('Processed collateral:', processedCollateral);
        setUserCollateral(processedCollateral);
      } else {
        console.log('No collateral found - response is empty or invalid');
        console.log('This means the user has no active collateral');
        setUserCollateral([]);
      }
    } catch (error) {
      console.error('Error fetching user collateral:', error);
      setUserCollateral([]);
    }
  };

  // Fetch lending pool stats
  const fetchLendingStats = async () => {
    try {
      const response = await callViewFunction(
        `0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23::nft_rewards::get_lending_pool_stats`,
        []
      );
      
      if (response && Array.isArray(response) && response.length >= 4) {
        setLendingStats({
          totalLent: Number(response[0]) / 1000000, // Convert from smallest units
          totalRecovered: Number(response[1]) / 1000000,
          activeLoans: Number(response[2]),
          totalLoans: Number(response[3])
        });
      }
    } catch (error) {
      console.error('Error fetching lending stats:', error);
    }
  };

  // Helper functions
  const callViewFunction = async (functionName: string, args: any[] = []) => {
    try {
      const requestBody = {
        function: functionName,
        type_arguments: [],
        arguments: args.map(arg => {
          if (arg === undefined || arg === null) {
            return '0';
          }
          return arg.toString();
        }),
      };
      
      const response = await fetch('https://fullnode.testnet.aptoslabs.com/v1/view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer aptoslabs_eJJWS8wiFGb_Ae2G5Vzscy8XDVXB4qS9p1J6nzAupxez9',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (response.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        return callViewFunction(functionName, args);
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, text: ${errorText}`);
      }
      
      const responseText = await response.text();
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Raw fetch failed:', error);
      throw error;
    }
  };

  const getRarityName = (rarity: number): string => {
    const rarityMap = { 1: 'Common', 2: 'Rare', 3: 'Epic', 4: 'Legendary' };
    return rarityMap[rarity as keyof typeof rarityMap] || 'Unknown';
  };

  const getTypeName = (type: number): string => {
    const typeMap = { 1: 'Win Badge', 2: 'Achievement', 3: 'Streak', 4: 'Seasonal' };
    return typeMap[type as keyof typeof typeMap] || 'Unknown';
  };

  const calculateNFTValue = (nftType: number, rarity: number): number => {
    const baseValue = nftType === 1 ? 1 : nftType === 2 ? 2 : nftType === 3 ? 1.5 : 0.5;
    const rarityMultiplier = rarity === 1 ? 1 : rarity === 2 ? 2 : rarity === 3 ? 5 : 10;
    return baseValue * rarityMultiplier;
  };

  const mockUsdcToNumber = (amount: string | number): number => {
    return Number(amount) / 1000000;
  };

  // Use NFT as collateral
  const handleUseNFTAsCollateral = async () => {
    if (!selectedNFT || !selectedMarket || !betAmount) {
      setError('Please select an NFT, market, and bet amount');
      return;
    }

    const betAmountNumber = parseFloat(betAmount);
    if (betAmountNumber <= 0) {
      setError('Bet amount must be greater than 0');
      return;
    }

    const selectedNFTData = userNFTs.find(nft => nft.id === selectedNFT);
    if (!selectedNFTData) {
      setError('Selected NFT not found');
      return;
    }

    if (betAmountNumber > selectedNFTData.estimatedValue) {
      setError(`Bet amount cannot exceed NFT value ($${selectedNFTData.estimatedValue})`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Using NFT as collateral:', {
        nftId: selectedNFT,
        marketId: selectedMarket,
        betAmount: betAmountNumber,
        selectedNFTData: selectedNFTData
      });

      // Log the exact NFT ID being sent
      console.log('Selected NFT raw data:', selectedNFTData?.rawData);
      console.log('NFT ID being sent to contract:', selectedNFT);

      const payload = {
        type: "entry_function_payload",
        function: `0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23::nft_rewards::use_nft_as_collateral`,
        type_arguments: [],
        arguments: [
          selectedNFT, // Use the exact NFT ID from the blockchain
          selectedMarket,
          (betAmountNumber * 1000000).toString() // Convert to smallest units
        ],
      };

      console.log('Transaction payload:', payload);

      const result = await signAndSubmitTransaction(payload);
      console.log('NFT collateral transaction:', result);
      
      // Refresh data
      await Promise.all([
        fetchUserNFTs(),
        fetchUserCollateral(),
        fetchLendingStats()
      ]);
      
      setSelectedNFT('');
      setSelectedMarket('');
      setBetAmount('');
      
    } catch (error) {
      console.error('Error using NFT as collateral:', error);
      setError(`Transaction failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account?.address) {
      Promise.all([
        fetchUserNFTs(),
        fetchActiveMarkets(),
        fetchUserCollateral(),
        fetchLendingStats()
      ]);
    }
  }, [account?.address]);

  if (!account?.address) {
    return (
      <Card className="p-6 text-center">
        <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">Connect Wallet Required</h3>
        <p className="text-gray-600">Please connect your wallet to use NFT lending</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">NFT Lending System</h2>
        <p className="text-gray-600">Use your NFTs as collateral to place bets without USDC</p>
      </div>

      {/* Lending Pool Stats */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Lending Pool Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">${lendingStats.totalLent.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Total Lent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">${lendingStats.totalRecovered.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Total Recovered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{lendingStats.activeLoans}</div>
            <div className="text-sm text-gray-600">Active Loans</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{lendingStats.totalLoans}</div>
            <div className="text-sm text-gray-600">Total Loans</div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="lend" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lend">Use NFT as Collateral</TabsTrigger>
          <TabsTrigger value="active">Active Collateral</TabsTrigger>
        </TabsList>

        <TabsContent value="lend" className="space-y-6">
          {/* NFT Selection */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Select NFT for Collateral</h3>
            {userNFTs.length === 0 ? (
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You don't have any NFTs. Mint some by winning bets first!
                  </AlertDescription>
                </Alert>
                
                {/* Static NFT Holder */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="p-4 border-2 border-dashed border-gray-300 bg-gray-50">
                    <div className="w-full h-32 rounded mb-3 flex items-center justify-center border-2 border-gray-400" style={{ backgroundColor: '#3B82F6' }}>
                      <div className="text-white text-center">
                        <div className="text-2xl mb-1">🛡️</div>
                        <div className="text-xs font-semibold">Common</div>
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-500">No NFT Available</h4>
                    <div className="text-xs text-gray-400 mb-2">
                      ID: placeholder_nft
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <Badge variant="outline" className="text-gray-400">Common</Badge>
                      <span className="text-sm font-medium text-gray-400">
                        $0.00
                      </span>
                    </div>
                  </Card>
                  
                  <Card className="p-4 border-2 border-dashed border-gray-300 bg-gray-50">
                    <div className="w-full h-32 rounded mb-3 flex items-center justify-center border-2 border-blue-400" style={{ backgroundColor: '#3B82F6' }}>
                      <div className="text-white text-center">
                        <div className="text-2xl mb-1">⚔️</div>
                        <div className="text-xs font-semibold">Rare</div>
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-500">Win Badge Placeholder</h4>
                    <div className="text-xs text-gray-400 mb-2">
                      ID: placeholder_badge
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <Badge variant="outline" className="text-gray-400">Rare</Badge>
                      <span className="text-sm font-medium text-gray-400">
                        $0.00
                      </span>
                    </div>
                  </Card>
                  
                  <Card className="p-4 border-2 border-dashed border-gray-300 bg-gray-50">
                    <div className="w-full h-32 rounded mb-3 flex items-center justify-center border-2 border-yellow-400" style={{ backgroundColor: '#3B82F6' }}>
                      <div className="text-white text-center">
                        <div className="text-2xl mb-1">👑</div>
                        <div className="text-xs font-semibold">Legendary</div>
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-500">Achievement Placeholder</h4>
                    <div className="text-xs text-gray-400 mb-2">
                      ID: placeholder_achievement
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <Badge variant="outline" className="text-gray-400">Legendary</Badge>
                      <span className="text-sm font-medium text-gray-400">
                        $0.00
                      </span>
                    </div>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userNFTs.map((nft) => (
                  <Card 
                    key={nft.id} 
                    className={`p-4 cursor-pointer transition-all ${
                      selectedNFT === nft.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => {
                      console.log('NFT clicked:', nft);
                      console.log('Setting selected NFT ID:', nft.id);
                      setSelectedNFT(nft.id);
                    }}
                  >
                    <div 
                      className={`w-full h-32 rounded mb-3 flex items-center justify-center ${
                        nft.rarity === 'Common' ? 'border-2 border-gray-400' :
                        nft.rarity === 'Rare' ? 'border-2 border-blue-400' :
                        nft.rarity === 'Epic' ? 'border-2 border-purple-400' :
                        nft.rarity === 'Legendary' ? 'border-2 border-yellow-400' :
                        'border-2 border-gray-400'
                      }`}
                      style={{ backgroundColor: '#3B82F6' }}
                    >
                      <div className="text-white text-center">
                        <div className="text-2xl mb-1">
                          {nft.rarity === 'Common' ? '🛡️' :
                           nft.rarity === 'Rare' ? '⚔️' :
                           nft.rarity === 'Epic' ? '🔮' :
                           nft.rarity === 'Legendary' ? '👑' :
                           '🛡️'}
                        </div>
                        <div className="text-xs font-semibold">{nft.rarity}</div>
                      </div>
                    </div>
                    <h4 className="font-semibold truncate">{nft.name}</h4>
                    <div className="text-xs text-gray-500 mb-2 break-all">
                      ID: {nft.id}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <Badge variant="secondary">{nft.rarity}</Badge>
                      <span className="text-sm font-medium text-green-600">
                        ${nft.estimatedValue}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>

          {/* Market Selection */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Select Market to Bet On</h3>
            <Select value={selectedMarket} onValueChange={setSelectedMarket}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a market" />
              </SelectTrigger>
              <SelectContent>
                {activeMarkets.map((market) => (
                  <SelectItem key={market.id} value={market.id.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{market.question}</span>
                      <span className="text-sm text-gray-500">
                        Market #{market.id} • ${mockUsdcToNumber(market.total_staked).toFixed(2)} staked
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Bet Amount */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Bet Amount</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="betAmount">Amount (USDC)</Label>
                <Input
                  id="betAmount"
                  type="number"
                  placeholder="Enter bet amount"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              {selectedNFT && (
                <div className="text-sm text-gray-600">
                  <strong>Max bet:</strong> ${userNFTs.find(nft => nft.id === selectedNFT)?.estimatedValue || 0}
                </div>
              )}
            </div>
          </Card>

          {/* Action Button */}
          <Card className="p-6">
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                onClick={handleUseNFTAsCollateral}
                disabled={loading || !selectedNFT || !selectedMarket || !betAmount}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Use NFT as Collateral
                  </>
                )}
              </Button>
              
              <div className="text-sm text-gray-600 text-center">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                <strong>Risk:</strong> If you lose, your NFT will be liquidated
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Your Active Collateral</h3>
            <div className="mb-4">
              <Button 
                onClick={fetchUserCollateral}
                variant="outline"
                size="sm"
                className="mr-2"
              >
                Refresh Collateral
              </Button>
              <Button 
                onClick={() => {
                  console.log('Current userCollateral state:', userCollateral);
                  console.log('userCollateral length:', userCollateral.length);
                  if (userCollateral.length > 0) {
                    console.log('First collateral raw data:', userCollateral[0].rawData);
                    console.log('First collateral processed:', userCollateral[0]);
                  }
                }}
                variant="outline"
                size="sm"
              >
                Debug Collateral
              </Button>
            </div>
            {userCollateral.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  You don't have any active NFT collateral
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {userCollateral.map((collateral, index) => (
                  <Card key={collateral.loan_id || index} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">NFT Collateral</h4>
                        <p className="text-sm text-gray-600">NFT ID: {String(collateral.nft_id || 'Unknown')}</p>
                        <p className="text-sm text-gray-600">Market #{String(collateral.market_id || 'Unknown')}</p>
                        <p className="text-sm text-gray-600">
                          Created: {collateral.created_at ? 
                            new Date(Number(collateral.created_at) * 1000).toLocaleDateString() : 
                            'Unknown Date'
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          ${collateral.bet_amount ? 
                            mockUsdcToNumber(String(collateral.bet_amount)).toFixed(2) : 
                            '0.00'
                          }
                        </div>
                        <div className="text-sm text-gray-600">
                          Collateral: ${collateral.collateral_value ? 
                            mockUsdcToNumber(String(collateral.collateral_value)).toFixed(2) : 
                            '0.00'
                          }
                        </div>
                        <Badge variant="outline" className="mt-1">
                          {String(collateral.status || 'Active')}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
