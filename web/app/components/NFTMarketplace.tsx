"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@/lib/wallet-context";
import { MODULE_NAMES } from "@/lib/aptos-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  ShoppingCart, 
  Tag, 
  TrendingUp, 
  Coins, 
  Star, 
  Trophy, 
  Flame,
  RefreshCw,
  Plus,
  Eye
} from "lucide-react";

interface MarketplaceListing {
  id: string;
  nftId: string;
  seller: string;
  price: number;
  currency: string;
  listedAt: string;
  nft: {
    name: string;
    description: string;
    image: string;
    rarity: string;
    type: string;
    metadata: any;
  };
}

interface NFTForSale {
  id: string;
  name: string;
  description: string;
  image: string;
  rarity: string;
  type: string;
  metadata: any;
  estimatedValue: number;
}

const NFTMarketplace = () => {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const [activeTab, setActiveTab] = useState("browse");
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [myNFTs, setMyNFTs] = useState<NFTForSale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [listingPrice, setListingPrice] = useState("");
  const [selectedNFT, setSelectedNFT] = useState<NFTForSale | null>(null);

  // Calculate NFT value based on rarity and metadata
  const calculateNFTValue = (nft: NFTForSale): number => {
    let baseValue = 10; // Base MUSDC value
    
    // Rarity multiplier
    const rarityMultipliers = {
      common: 1,
      rare: 2,
      epic: 4,
      legendary: 8
    };
    
    const rarityMultiplier = rarityMultipliers[nft.rarity as keyof typeof rarityMultipliers] || 1;
    
    // Type multiplier
    const typeMultipliers = {
      win_badge: 1,
      achievement: 1.5,
      streak: 3,
      seasonal: 2
    };
    
    const typeMultiplier = typeMultipliers[nft.type as keyof typeof typeMultipliers] || 1;
    
    // Metadata-based bonuses
    let metadataBonus = 0;
    if (nft.metadata?.marketId) {
      metadataBonus += nft.metadata.marketId * 2; // Higher market ID = more value
    }
    if (nft.metadata?.streakLength) {
      metadataBonus += nft.metadata.streakLength * 5; // Streak length bonus
    }
    if (nft.metadata?.odds) {
      const oddsValue = parseFloat(nft.metadata.odds.split(':')[0]);
      metadataBonus += oddsValue * 3; // Higher odds = more value
    }
    
    return Math.round((baseValue + metadataBonus) * rarityMultiplier * typeMultiplier);
  };

  // Get rarity color
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500';
      case 'rare': return 'bg-blue-500';
      case 'epic': return 'bg-purple-500';
      case 'legendary': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'win_badge': return Trophy;
      case 'achievement': return Star;
      case 'streak': return Flame;
      case 'seasonal': return Star;
      default: return Trophy;
    }
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

      if (response.status === 429) {
        console.log("Rate limited, waiting 5 seconds...");
        await new Promise(resolve => setTimeout(resolve, 5000));
        return callViewFunction(functionName, args);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log(`Raw response for ${functionName}:`, responseText);
      
      try {
        const data = JSON.parse(responseText);
        return data;
      } catch (parseError) {
        console.error(`JSON parse error for ${functionName}:`, parseError);
        console.error(`Response text:`, responseText);
        const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parse error';
        throw new Error(`Invalid JSON response: ${errorMessage}`);
      }
    } catch (error) {
      console.error(`Error calling view function ${functionName}:`, error);
      return null;
    }
  };

  // Fetch marketplace listings from blockchain
  const fetchListings = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching marketplace listings...");
      const listingsResponse = await callViewFunction(
        `${MODULE_NAMES.NFT_MARKETPLACE}::get_marketplace_listings`,
        []
      );

      // Handle the response structure - it might be wrapped in an array
      let actualListings = listingsResponse;
      if (Array.isArray(listingsResponse) && listingsResponse.length > 0 && Array.isArray(listingsResponse[0])) {
        actualListings = listingsResponse[0];
        console.log("Unwrapped listings from nested array:", actualListings);
      }

      console.log("Raw listings response:", listingsResponse);
      console.log("Response type:", typeof listingsResponse);
      console.log("Response length:", listingsResponse?.length);
      console.log("Is array:", Array.isArray(listingsResponse));
      console.log("Actual listings:", actualListings);
      console.log("Actual listings length:", actualListings?.length);

      // Validate that actualListings is an array
      if (!Array.isArray(actualListings)) {
        console.log("actualListings is not an array:", typeof actualListings, actualListings);
        setListings([]);
        return;
      }

      if (actualListings && actualListings.length > 0) {
        console.log(`Found ${actualListings.length} listings on blockchain`);
        console.log("First listing:", actualListings[0]);
        
        const activeListings = actualListings.filter((listing: any) => listing.active === true);
        console.log(`Active listings: ${activeListings.length}`);
        console.log("Active listings:", activeListings);
        const blockchainListings: MarketplaceListing[] = await Promise.all(
          actualListings
            .filter((listing: any) => listing.active === true)
            .map(async (listing: any, index: number) => {
              const nftName = `NFT #${index + 1}`;
              const imageUrl = `https://picsum.photos/200/200?random=${index + 1}`;
              
              // Determine rarity based on price or other factors
              const price = parseInt(listing.price) / 1000000 || 0;
              let rarity = "Common";
              if (price >= 100) {
                rarity = "Legendary";
              } else if (price >= 50) {
                rarity = "Epic";
              } else if (price >= 20) {
                rarity = "Rare";
              }

              const processedListing = {
                id: listing.listing_id || `listing_${index}`,
                nftId: listing.nft_id || `nft_${index}`,
                seller: listing.seller || "0x0000...0000",
                price: price,
                currency: listing.currency || "MUSDC",
                listedAt: new Date(parseInt(listing.listed_at) * 1000).toISOString().split('T')[0] || "2024-01-01",
                nft: {
                  name: nftName,
                  description: "Blockchain NFT from marketplace",
                  image: imageUrl,
                  rarity: rarity,
                  type: "win_badge",
                  metadata: { marketId: index + 1, odds: "1.5:1" }
                }
              };
              
              console.log(`Processed listing ${index}:`, processedListing);
              return processedListing;
            })
        );
        
        console.log(`Setting ${blockchainListings.length} listings in state`);
        setListings(blockchainListings);
      } else {
        console.log("No listings found on blockchain - showing empty state");
        setListings([]);
      }
    } catch (error) {
      console.error("Error fetching marketplace listings:", error);
      setListings([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user's NFTs for selling from blockchain
  const fetchMyNFTs = async () => {
    if (!connected || !account) return;
    
    try {
      console.log(`Fetching NFTs for user: ${account.address}`);
      const userNFTsResponse = await callViewFunction(
        `${MODULE_NAMES.NFT_MARKETPLACE}::get_user_nfts`,
        [account.address]
      );

      console.log("Raw user NFTs response:", userNFTsResponse);

      // Check if response is valid
      if (!userNFTsResponse) {
        console.log("No response from blockchain");
        setMyNFTs([]);
        return;
      }

      // Handle the response structure - it might be wrapped in an array
      let actualNFTs = userNFTsResponse;
      if (Array.isArray(userNFTsResponse) && userNFTsResponse.length > 0 && Array.isArray(userNFTsResponse[0])) {
        actualNFTs = userNFTsResponse[0];
        console.log("Unwrapped NFTs from nested array:", actualNFTs);
      }

      console.log("Actual NFTs:", actualNFTs);
      console.log("Actual NFTs length:", actualNFTs?.length);

      // Validate that actualNFTs is an array
      if (!Array.isArray(actualNFTs)) {
        console.log("actualNFTs is not an array:", typeof actualNFTs, actualNFTs);
        setMyNFTs([]);
        return;
      }

      if (actualNFTs && actualNFTs.length > 0) {
        console.log(`Found ${actualNFTs.length} NFTs for user`);
        const blockchainNFTs: (NFTForSale | null)[] = await Promise.all(
          actualNFTs.map(async (nft: any, index: number) => {
            try {
              // Validate NFT object structure
              if (!nft || typeof nft !== 'object') {
                console.warn(`Invalid NFT object at index ${index}:`, nft);
                return null;
              }

              // Additional validation for required fields
              if (!nft.id && !nft.name) {
                console.warn(`NFT at index ${index} missing required fields:`, nft);
                return null;
              }

              // Parse rarity from number to string
              const rarityMap: { [key: number]: string } = { 1: "common", 2: "rare", 3: "epic", 4: "legendary" };
              const typeMap: { [key: number]: string } = { 1: "win_badge", 2: "achievement", 3: "streak", 4: "seasonal" };
              
              const nftName = nft.name || `NFT #${index + 1}`;
              const imageUrl = `https://picsum.photos/200/200?random=${index + 10}`;
              
              // Safe JSON parsing for metadata
              let metadata = {};
              try {
                if (nft.metadata && typeof nft.metadata === 'string') {
                  metadata = JSON.parse(nft.metadata);
                }
              } catch (parseError) {
                console.warn(`Failed to parse metadata for NFT ${index}:`, nft.metadata, parseError);
                metadata = { raw: nft.metadata };
              }
              
              const nftData: NFTForSale = {
                id: nft.id || `nft_${index}`,
                name: nftName,
                description: nft.description || "Blockchain NFT",
                image: imageUrl,
                rarity: rarityMap[nft.rarity] || "common",
                type: typeMap[nft.nft_type] || "win_badge",
                metadata: metadata,
                estimatedValue: 0
              };

              const processedNFT = {
                ...nftData,
                estimatedValue: calculateNFTValue(nftData)
              };
              
              console.log(`Processed user NFT ${index}:`, processedNFT);
              return processedNFT;
            } catch (error) {
              console.error(`Error processing NFT at index ${index}:`, error, nft);
              return null;
            }
          })
        );
        
        // Filter out null values (invalid NFTs)
        const validNFTs: NFTForSale[] = blockchainNFTs.filter((nft): nft is NFTForSale => nft !== null);
        
        console.log(`Setting ${validNFTs.length} valid user NFTs in state (filtered from ${blockchainNFTs.length})`);
        setMyNFTs(validNFTs);
      } else {
        console.log("No NFTs found for user - showing empty state");
        setMyNFTs([]);
      }
    } catch (error) {
      console.error("Error fetching user NFTs:", error);
      setMyNFTs([]);
    }
  };

  // Test function to directly call blockchain
  const testBlockchainCall = async () => {
    try {
      console.log("Testing direct blockchain call...");
      const response = await fetch('https://fullnode.testnet.aptoslabs.com/v1/view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer aptoslabs_eJJWS8wiFGb_Ae2G5Vzscy8XDVXB4qS9p1J6nzAupxez9',
        },
        body: JSON.stringify({
          function: `${MODULE_NAMES.NFT_MARKETPLACE}::get_marketplace_listings`,
          type_arguments: [],
          arguments: [],
        }),
      });

      const data = await response.json();
      console.log("Direct blockchain response:", data);
      return data;
    } catch (error) {
      console.error("Direct blockchain call error:", error);
    }
  };

  // Auto-list newly minted NFT for sale
  const autoListMintedNFT = async (nftId: string, nftName: string, estimatedValue: number) => {
    if (!connected || !account) return;
    
    try {
      console.log(`Auto-listing newly minted NFT ${nftName} for ${estimatedValue} MUSDC`);
      
      // Convert price to smallest units (6 decimals for MUSDC)
      const priceInSmallestUnits = Math.floor(estimatedValue * 1000000);
      
      const payload = {
        type: "entry_function_payload",
        function: `${MODULE_NAMES.NFT_MARKETPLACE}::list_nft_for_sale`,
        type_arguments: [],
        arguments: [
          nftId,
          priceInSmallestUnits.toString(),
          "MUSDC"
        ],
      };
      
      console.log("Auto-listing NFT with payload:", payload);
      
      // Execute the transaction
      await signAndSubmitTransaction(payload);
      
      console.log(`Successfully auto-listed ${nftName} for ${estimatedValue} MUSDC!`);
      
      // Refresh listings to show the new NFT
      await fetchListings();
      
    } catch (error) {
      console.error("Error auto-listing NFT:", error);
      // Don't show alert for auto-listing errors, just log them
    }
  };

  // List NFT for sale with real blockchain transaction
  const listNFTForSale = async (nft: NFTForSale, price: number) => {
    if (!connected || !account) return;
    
    try {
      setIsLoading(true);
      
      console.log(`Listing NFT ${nft.name} for ${price} MUSDC`);
      
      // Convert price to smallest units (6 decimals for MUSDC)
      const priceInSmallestUnits = Math.floor(price * 1000000);
      
      const payload = {
        type: "entry_function_payload",
        function: `${MODULE_NAMES.NFT_MARKETPLACE}::list_nft_for_sale`,
        type_arguments: [],
        arguments: [
          nft.id,
          priceInSmallestUnits.toString(),
          "MUSDC"
        ],
      };
      
      console.log("Listing NFT with payload:", payload);
      
      // Execute the transaction
      await signAndSubmitTransaction(payload);
      
      alert(`Successfully listed ${nft.name} for ${price} MUSDC!`);
      setSelectedNFT(null);
      setListingPrice("");
      
      // Refresh both listings and user NFTs
      await fetchListings();
      await fetchMyNFTs();
      
    } catch (error) {
      console.error("Error listing NFT:", error);
      alert(`Failed to list NFT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Buy NFT from marketplace with real blockchain transaction
  const buyNFT = async (listing: MarketplaceListing) => {
    if (!connected || !account) return;
    
    try {
      setIsLoading(true);
      
      console.log(`Buying NFT ${listing.nft.name} for ${listing.price} MUSDC`);
      
      // Convert price to smallest units (6 decimals for MUSDC)
      const priceInSmallestUnits = Math.floor(listing.price * 1000000);
      
      const payload = {
        type: "entry_function_payload", 
        function: `${MODULE_NAMES.NFT_MARKETPLACE}::buy_nft`,
        type_arguments: [],
        arguments: [
          listing.id
        ],
      };
      
      console.log("Buying NFT with payload:", payload);
      
      // Execute the transaction
      await signAndSubmitTransaction(payload);
      
      alert(`Successfully purchased ${listing.nft.name} for ${listing.price} MUSDC!`);
      
      // Refresh both listings and user NFTs
      await fetchListings();
      await fetchMyNFTs();
      
    } catch (error) {
      console.error("Error buying NFT:", error);
      alert(`Failed to purchase NFT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
    fetchMyNFTs();
    
    // Listen for NFT minting events to refresh marketplace
    const handleNFTMinted = () => {
      console.log("NFT minted event received, refreshing marketplace...");
      fetchListings();
      fetchMyNFTs();
    };
    
    window.addEventListener('nftMinted', handleNFTMinted);
    
    return () => {
      window.removeEventListener('nftMinted', handleNFTMinted);
    };
  }, [connected, account]);

  if (!connected) {
    return (
      <Card className="bg-black/60 border border-white/30 rounded-xl shadow-2xl backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <ShoppingCart className="w-5 h-5 text-blue-400" />
            NFT Marketplace
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300">Connect your wallet to access the NFT marketplace</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-black/60 border border-white/30 rounded-xl shadow-2xl backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <ShoppingCart className="w-5 h-5 text-blue-400" />
            NFT Marketplace
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-white/20 backdrop-blur-sm border border-white/30">
              <TabsTrigger value="browse" className="data-[state=active]:bg-white/30 data-[state=active]:text-white text-gray-200 hover:text-white">
                <Eye className="w-4 h-4 mr-2" />
                Browse
              </TabsTrigger>
              <TabsTrigger value="sell" className="data-[state=active]:bg-white/30 data-[state=active]:text-white text-gray-200 hover:text-white">
                <Tag className="w-4 h-4 mr-2" />
                Sell
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-white/30 data-[state=active]:text-white text-gray-200 hover:text-white">
                <TrendingUp className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Browse Marketplace */}
            <TabsContent value="browse" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Available NFTs</h3>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      console.log("Debug refresh triggered");
                      fetchListings();
                      fetchMyNFTs();
                    }}
                    variant="outline"
                    size="sm"
                    className="bg-red-500/20 hover:bg-red-500/30 text-white border-red-400"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Debug
                  </Button>
                  <Button 
                    onClick={testBlockchainCall}
                    variant="outline"
                    size="sm"
                    className="bg-blue-500/20 hover:bg-blue-500/30 text-white border-blue-400"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Test API
                  </Button>
                  <Button 
                    onClick={fetchListings}
                    variant="outline"
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/40"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
                  <span className="ml-3 text-gray-300">Loading marketplace...</span>
                </div>
              ) : listings.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                  <h3 className="text-lg font-semibold text-white mb-2">No NFTs Available</h3>
                  <p className="text-gray-400 mb-2">No NFTs are currently listed for sale on the marketplace.</p>
                  <p className="text-sm text-gray-500">Mint NFTs by winning prediction markets to see them here!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {listings.map((listing) => {
                    const TypeIcon = getTypeIcon(listing.nft.type);
                    return (
                      <Card key={listing.id} className="bg-white/10 border border-white/20 rounded-lg overflow-hidden">
                        <div 
                          className={`aspect-square flex items-center justify-center rounded ${
                            listing.nft.rarity === 'Common' ? 'border-2 border-gray-400' :
                            listing.nft.rarity === 'Rare' ? 'border-2 border-blue-400' :
                            listing.nft.rarity === 'Epic' ? 'border-2 border-purple-400' :
                            listing.nft.rarity === 'Legendary' ? 'border-2 border-yellow-400' :
                            'border-2 border-gray-400'
                          }`}
                          style={{ backgroundColor: '#3B82F6' }}
                        >
                          <div className="text-white text-center">
                            <div className="text-3xl mb-2">
                              {listing.nft.rarity === 'Common' ? '🛡️' :
                               listing.nft.rarity === 'Rare' ? '⚔️' :
                               listing.nft.rarity === 'Epic' ? '🔮' :
                               listing.nft.rarity === 'Legendary' ? '👑' :
                               '🛡️'}
                            </div>
                            <div className="text-sm font-semibold">{listing.nft.rarity}</div>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <TypeIcon className="w-5 h-5 text-yellow-400" />
                            <Badge className={`${getRarityColor(listing.nft.rarity)} text-white`}>
                              {listing.nft.rarity}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-white mb-2">{listing.nft.name}</h3>
                          <p className="text-sm text-gray-300 mb-3">{listing.nft.description}</p>
                          
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm text-gray-400">
                              Seller: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Coins className="w-4 h-4 text-green-400" />
                              <span className="text-lg font-bold text-green-400">
                                {listing.price} {listing.currency}
                              </span>
                            </div>
                            <Button
                              onClick={() => buyNFT(listing)}
                              disabled={isLoading || listing.seller === account?.address}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              size="sm"
                            >
                              {listing.seller === account?.address ? "Your NFT" : "Buy Now"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Sell NFTs */}
            <TabsContent value="sell" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Your NFTs</h3>
                <Button 
                  onClick={fetchMyNFTs}
                  variant="outline"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/40"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {myNFTs.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                  <h3 className="text-lg font-semibold text-white mb-2">No NFTs to Sell</h3>
                  <p className="text-gray-400 mb-2">You don't have any NFTs to sell yet.</p>
                  <p className="text-sm text-gray-500">Win prediction markets to earn NFT badges!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myNFTs.map((nft) => {
                    const TypeIcon = getTypeIcon(nft.type);
                    return (
                      <Card key={nft.id} className="bg-white/10 border border-white/20 rounded-lg overflow-hidden">
                        <div 
                          className={`aspect-square flex items-center justify-center rounded ${
                            nft.rarity === 'Common' ? 'border-2 border-gray-400' :
                            nft.rarity === 'Rare' ? 'border-2 border-blue-400' :
                            nft.rarity === 'Epic' ? 'border-2 border-purple-400' :
                            nft.rarity === 'Legendary' ? 'border-2 border-yellow-400' :
                            'border-2 border-gray-400'
                          }`}
                          style={{ backgroundColor: '#3B82F6' }}
                        >
                          <div className="text-white text-center">
                            <div className="text-3xl mb-2">
                              {nft.rarity === 'Common' ? '🛡️' :
                               nft.rarity === 'Rare' ? '⚔️' :
                               nft.rarity === 'Epic' ? '🔮' :
                               nft.rarity === 'Legendary' ? '👑' :
                               '🛡️'}
                            </div>
                            <div className="text-sm font-semibold">{nft.rarity}</div>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <TypeIcon className="w-5 h-5 text-yellow-400" />
                            <Badge className={`${getRarityColor(nft.rarity)} text-white`}>
                              {nft.rarity}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-white mb-2">{nft.name}</h3>
                          <p className="text-sm text-gray-300 mb-3">{nft.description}</p>
                          
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm text-gray-400">
                              Est. Value: <span className="text-green-400">{nft.estimatedValue} MUSDC</span>
                            </div>
                          </div>
                          
                          <Button
                            onClick={() => setSelectedNFT(nft)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            size="sm"
                          >
                            <Tag className="w-4 h-4 mr-2" />
                            List for Sale
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Analytics */}
            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-r from-blue-900/60 to-cyan-900/60 border-blue-400/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-8 h-8 text-blue-400" />
                      <div>
                        <p className="text-sm text-gray-300">Avg. NFT Price</p>
                        <p className="text-2xl font-bold text-blue-300">47 MUSDC</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-900/60 to-emerald-900/60 border-green-400/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="w-8 h-8 text-green-400" />
                      <div>
                        <p className="text-sm text-gray-300">Total Volume</p>
                        <p className="text-2xl font-bold text-green-300">1,250 MUSDC</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-purple-900/60 to-pink-900/60 border-purple-400/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Star className="w-8 h-8 text-purple-400" />
                      <div>
                        <p className="text-sm text-gray-300">Active Listings</p>
                        <p className="text-2xl font-bold text-purple-300">{listings.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-black/40 border border-white/20 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-white">Price Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">Marketplace analytics and price trends will be displayed here.</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Common Win Badges:</span>
                      <span className="text-green-400">12-18 MUSDC</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Rare Achievements:</span>
                      <span className="text-blue-400">25-40 MUSDC</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Epic Streak NFTs:</span>
                      <span className="text-purple-400">60-100 MUSDC</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Legendary Items:</span>
                      <span className="text-yellow-400">150+ MUSDC</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* List NFT Modal */}
      {selectedNFT && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-black/80 border border-white/30 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">List NFT for Sale</h3>
            
            <div className="mb-4">
              <img 
                src={selectedNFT.image} 
                alt={selectedNFT.name}
                className="w-24 h-24 rounded-lg mx-auto mb-4"
              />
              <h4 className="text-lg font-semibold text-white text-center">{selectedNFT.name}</h4>
              <p className="text-sm text-gray-400 text-center">
                Estimated Value: {selectedNFT.estimatedValue} MUSDC
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Sale Price (MUSDC)</label>
              <Input
                type="number"
                value={listingPrice}
                onChange={(e) => setListingPrice(e.target.value)}
                placeholder={selectedNFT.estimatedValue.toString()}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setSelectedNFT(null)}
                variant="outline"
                className="flex-1 bg-white/20 border-white/40 text-white hover:bg-white/30"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const price = parseFloat(listingPrice) || selectedNFT.estimatedValue;
                  listNFTForSale(selectedNFT, price);
                }}
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? "Listing..." : "List NFT"}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default NFTMarketplace;