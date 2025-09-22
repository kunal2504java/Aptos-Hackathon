import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

// Configure Aptos client for testnet
const config = new AptosConfig({ 
  network: Network.TESTNET 
});

export const aptosClient = new Aptos(config);

// Contract addresses (will be updated after deployment)
export const CONTRACT_ADDRESSES = {
  PREDICTION_MARKET: "0x1", // Will be updated after deployment
  MOCK_USDC: "0x1", // Will be updated after deployment
};

// Contract module names
export const MODULE_NAMES = {
  PREDICTION_MARKET: "omnibets::prediction_market",
  MOCK_USDC: "omnibets::mock_usdc",
};

// Helper function to get account address
export const getAccountAddress = async (): Promise<string | null> => {
  try {
    const account = await aptosClient.getAccountInfo();
    return account.account_address;
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
