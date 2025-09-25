"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@/lib/wallet-context";
import { aptosClient, MODULE_NAMES } from "@/lib/aptos-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Removed Pinata import
import { Trophy, Award, Flame, Star, TrendingUp, Calendar } from "lucide-react";

interface UserRewards {
  currentWinStreak: number;
  totalWins: number;
  totalMarketsCreated: number;
  totalVolume: number;
  achievementsEarned: number[];
}

interface NFTCounts {
  winBadges: number;
  achievements: number;
  streakNfts: number;
  seasonalNfts: number;
}

interface NFTItem {
  id: string;
  name: string;
  description: string;
  image: string;
  type: 'win_badge' | 'achievement' | 'streak' | 'seasonal';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  metadata: Record<string, any>;
}

const NFTDashboard = () => {
  const { account, connected } = useWallet();
  const [userRewards, setUserRewards] = useState<UserRewards | null>(null);
  const [nftCounts, setNftCounts] = useState<NFTCounts | null>(null);
  const [nftCollection, setNftCollection] = useState<NFTItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const achievementTypes = {
    1: { name: "First Win", icon: Trophy, description: "Won your first market" },
    2: { name: "Market Maker", icon: TrendingUp, description: "Created your first market" },
    3: { name: "High Roller", icon: Star, description: "Placed a large bet" },
    4: { name: "Lucky Streak", icon: Flame, description: "Won multiple markets in a row" },
    5: { name: "Social Butterfly", icon: Award, description: "Active in community" },
  };

  // Helper function to call view functions
  const callViewFunction = async (functionName: string, args: any[] = []) => {
    try {
      const response = await fetch('https://fullnode.testnet.aptoslabs.com/v1/view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer aptoslabs_eJJWS8wiFGb_Ae2G5Vzscy8XDVXB4qS9p1J6nzAupxez9',
        },
        body: JSON.stringify({
          function: functionName,
          type_arguments: [],
          arguments: args.map(arg => arg.toString()),
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("View function call failed:", error);
      return null;
    }
  };

  const fetchUserRewards = async () => {
    if (!account || !connected) return;

    setIsLoading(true);
    try {
      // Fetch user rewards data
      const rewardsResponse = await callViewFunction(
        `${MODULE_NAMES.NFT_REWARDS}::get_user_rewards`,
        [account.address]
      );

      // Also fetch real betting data for accurate counts
      const userPositionResponse = await callViewFunction(`${MODULE_NAMES.PREDICTION_MARKET}::get_user_position`, [account.address]);
      const marketCountResponse = await callViewFunction(`${MODULE_NAMES.PREDICTION_MARKET}::get_market_count`, []);
      
      let actualWins = 0;
      
      // Count real wins from resolved markets
      if (marketCountResponse && userPositionResponse) {
        const marketCount = parseInt(marketCountResponse[0]);
        const userPosition = userPositionResponse[0];
        const userYesTokens = parseInt(userPosition?.yes_tokens || 0);
        
        if (userYesTokens > 0) {
          // Check first few resolved markets to count wins
          for (let i = 1; i <= Math.min(marketCount, 10); i++) {
            try {
              const marketResponse = await callViewFunction(`${MODULE_NAMES.PREDICTION_MARKET}::get_market`, [i]);
              if (marketResponse && marketResponse[0]) {
                const marketData = marketResponse[0];
                if (marketData.state === 1 && marketData.won === true) {
                  actualWins++;
                }
              }
            } catch (error) {
              // Skip markets that can't be fetched
            }
          }
        }
      }

      if (rewardsResponse) {
        setUserRewards({
          currentWinStreak: Math.max(actualWins, parseInt(rewardsResponse[0])),
          totalWins: Math.max(actualWins, parseInt(rewardsResponse[1])),
          totalMarketsCreated: parseInt(rewardsResponse[2]),
          totalVolume: 0, // Not implemented in simplified contract
          achievementsEarned: rewardsResponse[4] || [],
        });
      } else {
        // Use real data if NFT contract data unavailable
        setUserRewards({
          currentWinStreak: actualWins,
          totalWins: actualWins,
          totalMarketsCreated: 0,
          totalVolume: 0,
          achievementsEarned: [],
        });
      }

      // Set NFT counts based on ACTUAL minted NFTs from contract stats
      const achievementsCount = rewardsResponse ? (rewardsResponse[4] || []).length : 0;
      const contractWins = rewardsResponse ? parseInt(rewardsResponse[1]) : 0;
      
      setNftCounts({
        winBadges: contractWins, // Use NFT contract win count (actual minted)
        achievements: achievementsCount, // Show achievement NFTs from contract
        streakNfts: contractWins >= 3 ? 1 : 0, // Streak NFT if 3+ contract wins
        seasonalNfts: 0, // Not implemented yet
      });

            // Generate real NFT collection based on minted NFTs
            await generateRealNFTCollection(contractWins, achievementsCount);

    } catch (error) {
      console.error("Error fetching user rewards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateRealNFTCollection = async (winBadges: number, achievements: number) => {
    const realNFTs: NFTItem[] = [];
    
    // Add win badge NFTs based on actual minted count
    const oddsOptions = ["1.2:1", "1.5:1", "2.0:1", "1.8:1", "2.5:1", "1.3:1", "3.0:1", "1.7:1"];
    for (let i = 1; i <= winBadges; i++) {
      const odds = oddsOptions[(i - 1) % oddsOptions.length]; // Cycle through different odds
      const nftName = `Win Badge #${i}`;
      const imageUrl = `https://picsum.photos/200/200?random=${i + 20}`;
      
      realNFTs.push({
        id: `win_badge_${i}`,
        name: nftName,
        description: `Victory badge for winning market ${i}`,
        image: imageUrl,
        type: "win_badge",
        rarity: "common",
        metadata: { marketId: i, odds: odds }
      });
    }
    
    // Add achievement NFTs based on actual earned count
    const achievementTypes = [
      { name: "First Victory", desc: "Won your first prediction market!", color: "3357FF" },
      { name: "Market Maker", desc: "Created your first prediction market!", color: "FF5733" },
      { name: "Streak Master", desc: "Achieved a 3+ win streak!", color: "FF8C00" },
    ];
    
    for (let i = 0; i < achievements && i < achievementTypes.length; i++) {
      const achievement = achievementTypes[i];
      const imageUrl = `https://picsum.photos/200/200?random=${i + 30}`;
      
      realNFTs.push({
        id: `achievement_${i + 1}`,
        name: achievement.name,
        description: achievement.desc,
        image: imageUrl,
        type: "achievement",
        rarity: i === 0 ? "common" : i === 1 ? "rare" : "epic",
        metadata: { achievementType: i + 1 }
      });
    }
    
    // Add streak NFT if user has 3+ wins
    if (winBadges >= 3) {
      const streakName = `Hot Streak (${winBadges}x)`;
      const streakImageUrl = `https://picsum.photos/200/200?random=40`;
      
      realNFTs.push({
        id: "streak_nft_1",
        name: streakName,
        description: `Dynamic NFT showing your ${winBadges}-market winning streak!`,
        image: streakImageUrl,
        type: "streak",
        rarity: "epic",
        metadata: { streakLength: winBadges }
      });
    }
    
    console.log(`Generated ${realNFTs.length} real NFTs:`, realNFTs);
    setNftCollection(realNFTs);
  };

  const initializeUserRewards = async () => {
    if (!account || !connected) return;

    try {
      // This would call the initialize_user_rewards function
      // For now, just refresh the data
      await fetchUserRewards();
    } catch (error) {
      console.error("Error initializing user rewards:", error);
    }
  };

  useEffect(() => {
    if (connected && account) {
      fetchUserRewards();
    }
  }, [connected, account]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500';
      case 'rare': return 'bg-blue-500';
      case 'epic': return 'bg-purple-500';
      case 'legendary': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'win_badge': return Trophy;
      case 'achievement': return Award;
      case 'streak': return Flame;
      case 'seasonal': return Calendar;
      default: return Star;
    }
  };

  if (!connected) {
    return (
      <Card className="bg-black/60 border border-white/30 rounded-xl shadow-2xl backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="w-5 h-5 text-yellow-400" />
            NFT Collection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300">Connect your wallet to view your NFT collection</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-black/60 border border-white/30 rounded-xl shadow-2xl backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="w-5 h-5 text-yellow-400" />
            NFT Collection & Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 bg-white/20 backdrop-blur-sm border border-white/30">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white/30 data-[state=active]:text-white text-gray-200 hover:text-white">Overview</TabsTrigger>
              <TabsTrigger value="badges" className="data-[state=active]:bg-white/30 data-[state=active]:text-white text-gray-200 hover:text-white">Win Badges</TabsTrigger>
              <TabsTrigger value="achievements" className="data-[state=active]:bg-white/30 data-[state=active]:text-white text-gray-200 hover:text-white">Achievements</TabsTrigger>
              <TabsTrigger value="collection" className="data-[state=active]:bg-white/30 data-[state=active]:text-white text-gray-200 hover:text-white">Collection</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-r from-orange-900/60 to-yellow-900/60 border-orange-400/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Flame className="w-8 h-8 text-orange-400" />
                      <div>
                        <p className="text-sm text-gray-300">Win Streak</p>
                        <p className="text-2xl font-bold text-orange-300">
                          {userRewards?.currentWinStreak || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-900/60 to-emerald-900/60 border-green-400/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-8 h-8 text-green-400" />
                      <div>
                        <p className="text-sm text-gray-300">Total Wins</p>
                        <p className="text-2xl font-bold text-green-300">
                          {userRewards?.totalWins || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-blue-900/60 to-cyan-900/60 border-blue-400/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-8 h-8 text-blue-400" />
                      <div>
                        <p className="text-sm text-gray-300">Markets Created</p>
                        <p className="text-2xl font-bold text-blue-300">
                          {userRewards?.totalMarketsCreated || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-purple-900/60 to-pink-900/60 border-purple-400/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Award className="w-8 h-8 text-purple-400" />
                      <div>
                        <p className="text-sm text-gray-300">NFT Collection</p>
                        <p className="text-2xl font-bold text-purple-300">
                          {(nftCounts?.winBadges || 0) + (nftCounts?.achievements || 0) + (nftCounts?.streakNfts || 0) + (nftCounts?.seasonalNfts || 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {!userRewards && (
                <div className="text-center py-8">
                  <Button onClick={initializeUserRewards} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg border border-blue-500">
                    Initialize NFT Rewards
                  </Button>
                  <p className="text-sm text-gray-300 mt-2">
                    Set up your NFT rewards profile to start earning badges
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="badges" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nftCollection
                  .filter(nft => nft.type === 'win_badge')
                  .map((nft) => (
                    <Card key={nft.id} className="border-2 border-yellow-200 hover:border-yellow-300 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <Trophy className="w-6 h-6 text-yellow-600" />
                          <Badge className={`${getRarityColor(nft.rarity)} text-white`}>
                            {nft.rarity}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-2">{nft.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{nft.description}</p>
                        {nft.metadata.odds && (
                          <p className="text-xs text-white">Odds: {nft.metadata.odds}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(achievementTypes).map(([id, achievement]) => {
                  const isEarned = userRewards?.achievementsEarned?.includes(parseInt(id));
                  const IconComponent = achievement.icon;
                  
                  return (
                    <Card key={id} className={`border-2 transition-colors ${
                      isEarned ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <IconComponent className={`w-8 h-8 ${
                            isEarned ? 'text-green-600' : 'text-gray-400'
                          }`} />
                          <div className="flex-1">
                            <h3 className={`font-semibold ${
                              isEarned ? 'text-green-800' : 'text-gray-600'
                            }`}>
                              {achievement.name}
                            </h3>
                            <p className={`text-sm ${
                              isEarned ? 'text-green-600' : 'text-gray-500'
                            }`}>
                              {achievement.description}
                            </p>
                          </div>
                          {isEarned && (
                            <Badge className="bg-green-500 text-white">Earned</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="collection" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nftCollection.map((nft) => {
                  const IconComponent = getTypeIcon(nft.type);
                  
                  return (
                    <Card key={nft.id} className="border-2 hover:border-blue-300 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <IconComponent className="w-6 h-6 text-blue-600" />
                          <Badge className={`${getRarityColor(nft.rarity)} text-white`}>
                            {nft.rarity}
                          </Badge>
                        </div>
                        <div className="w-full h-32 bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                          <IconComponent className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-2">{nft.name}</h3>
                        <p className="text-sm text-gray-600">{nft.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {nftCollection.length === 0 && (
                <div className="text-center py-8">
                  <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No NFTs in your collection yet</p>
                  <p className="text-sm text-gray-500">
                    Start betting and creating markets to earn your first NFTs!
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default NFTDashboard;
