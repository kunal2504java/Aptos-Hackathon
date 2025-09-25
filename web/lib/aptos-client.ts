import { Aptos, AptosConfig, Network, ClientConfig } from "@aptos-labs/ts-sdk";

// Configure Aptos client for testnet with API key
const clientConfig: ClientConfig = {
  API_KEY: "aptoslabs_eJJWS8wiFGb_Ae2G5Vzscy8XDVXB4qS9p1J6nzAupxez9"
};

const config = new AptosConfig({ 
  network: Network.TESTNET,
  clientConfig
});

export const aptosClient = new Aptos(config);

// Contract addresses (deployed on testnet)
export const CONTRACT_ADDRESSES = {
  PREDICTION_MARKET: "0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23",
  MOCK_USDC: "0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23",
};

// Contract module names
export const MODULE_NAMES = {
  PREDICTION_MARKET: `${CONTRACT_ADDRESSES.PREDICTION_MARKET}::prediction_market`,
  MOCK_USDC: `${CONTRACT_ADDRESSES.MOCK_USDC}::mock_usdc`,
  NFT_REWARDS: `${CONTRACT_ADDRESSES.PREDICTION_MARKET}::nft_rewards`,
  NFT_MARKETPLACE: `${CONTRACT_ADDRESSES.PREDICTION_MARKET}::nft_rewards`, // Same contract, different functions
};

// Helper function to get account address
export const getAccountAddress = async (): Promise<string | null> => {
  try {
    // In Aptos SDK v5, we need to provide an address to get account info
    // This function is mainly used for checking if an account exists
    // For wallet integration, we'll get the address from the wallet directly
    return null; // This function is deprecated in favor of wallet-based address retrieval
  } catch (error) {
    console.error("Error getting account address:", error);
    return null;
  }
};

// Helper function to check if wallet is connected
export const isWalletConnected = async (): Promise<boolean> => {
  try {
    const address = await getAccountAddress();
    return address !== null;
  } catch (error) {
    return false;
  }
};
