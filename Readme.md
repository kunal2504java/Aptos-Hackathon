# OmniBets: Cross-Chain Prediction Markets with Reactive Smart Contracts

## Overview

OmniBets is a **cross-chain prediction market** that leverages **Reactive Smart Contracts (RSCs)** to seamlessly synchronize market states across multiple blockchains. By incorporating RSCs, OmniBets eliminates the need for manual bridging, wrapped tokens, or centralized oracles, making it a **fully decentralized and reactive cross-chain solution**.

**🚀 Now configured for Avalanche Fuji Testnet!**

## Architecture

![image](https://github.com/user-attachments/assets/002e164a-0f84-468b-9637-e6dd2ade5ef8)

## 🏗️ **How OmniBets Uses RSCs**

1. **Cross-Chain Market Creation** – When a market is created on one chain, RSCs **react** to deploy the same market on connected chains.
2. **Real-Time Liquidity Updates** – Any bet placed in the main market triggers **automatic liquidity synchronization** across chains.
3. **Trustless Market Resolution** – RSCs verify results and execute **automated token minting/burning** across chains to distribute rewards.

---

## 🚀 **Deployment Guide**

### **Prerequisites**

Set the following environment variables in your `.env` file or export in terminal:

```bash
# Avalanche Fuji Testnet Configuration
SOURCE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
DESTINATION_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
SOURCE_CHAINID=43113
DESTINATION_CHAINID=43113
SERVICE_CONTRACT= <Service Contract Address>
CALLBACK_CONTRACT= <Callback Contract Address>
PRIVATE_KEY= <Your private key>
REACTIVE_RPC= <Reactive RPC URL>
REACTIVE_PRIVATE_KEY= <Reactive Private Key>
```

```bash
cd boilerplate
```

### **🔧 Getting Fuji Testnet AVAX**

Before deploying, you'll need Fuji testnet AVAX for gas fees:

1. **Get Fuji AVAX from Faucet:**
   - Visit: https://faucet.avax.network/
   - Enter your wallet address
   - Request testnet AVAX

2. **Alternative Faucets:**
   - https://faucet.quicknode.com/avalanche/fuji
   - https://core.app/tools/testnet-faucet/?subnet=c&token=c

3. **Verify Balance:**
   ```bash
   # Check your balance on Fuji testnet
   cast balance <YOUR_ADDRESS> --rpc-url https://api.avax-test.network/ext/bc/C/rpc
   ```

### **1️⃣ Deploy Main Prediction Market (Fuji)**

```bash
forge script src/demos/PredicitionMarket/script/DeployPredictionMarketFuji.s.sol \
  --rpc-url $SOURCE_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast --via-ir
```

**Contract Addresses:**
*Update these in `web/lib/const.ts` after deployment*

```ts
MockUSDC deployed to: [TO_BE_UPDATED]
PredictionMarket deployed to: [TO_BE_UPDATED]
```

### **2️⃣ Deploy Sub Prediction Market (Fuji)**

```bash
forge script src/demos/PredicitionMarket/script/DeploySubPredictionMarketFuji.s.sol \
  --rpc-url $SOURCE_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast --via-ir
```

**Contract Addresses:**
*Update these in `web/lib/const.ts` after deployment*

```ts
MockUSDC deployed to: [TO_BE_UPDATED]
PredictionMarketFuji deployed to: [TO_BE_UPDATED]
```

### **4️⃣ Update Web App Configuration**

After deploying contracts, update the addresses in `web/lib/const.ts`:

```typescript
// Replace placeholder addresses with actual deployed addresses
export const USDC_ADDRESS_FUJI_A = "0x[YOUR_DEPLOYED_USDC_A]";
export const USDC_ADDRESS_FUJI_B = "0x[YOUR_DEPLOYED_USDC_B]";
export const PredictionMarketAddressFujiA = "0x[YOUR_DEPLOYED_MARKET_A]";
export const PredictionMarketAddressFujiB = "0x[YOUR_DEPLOYED_MARKET_B]";
```

### **5️⃣ Deploy RSC Cross-Chain Aggregator**

```bash
forge create --legacy \
  --rpc-url $REACTIVE_RPC \
  --private-key $REACTIVE_PRIVATE_KEY \
  --broadcast \
  src/demos/PredicitionMarket/CrossChainAggregator.sol:CrossChainAggregator \
  --value 0.01ether \
  --constructor-args $SYSTEM_CONTRACT_ADDR $SOURCE_CHAINID $DESTINATION_CHAINID \
  <PredictionMarket_Address_Main> <PredictionMarket_Address_Sub> --via-ir
```

**Contract Address:**

```ts
Deployed to: 0x7fca273E558f7C37b1b763Bcf21E2F93F6e150E4
```

### **6️⃣ Run the Web Application**

```bash
cd web
npm install
npm run dev
```

The application will be available at `http://localhost:3000`

**Note:** Make sure to connect your wallet to Avalanche Fuji testnet in MetaMask or your preferred wallet.

---

## 🔗 **Avalanche Fuji Testnet Details**

- **Chain ID:** 43113
- **RPC URL:** https://api.avax-test.network/ext/bc/C/rpc
- **Explorer:** https://testnet.snowtrace.io/
- **Native Token:** AVAX
- **Faucet:** https://faucet.avax.network/

---

### **1️⃣ Market Creation**

- **Origin:** [https://sepolia.etherscan.io/tx/0x9b064f66953311fc10f79009a81d4ff75ff73e9d389a9af0e4a39b1503a7020e](https://sepolia.etherscan.io/tx/0x9b064f66953311fc10f79009a81d4ff75ff73e9d389a9af0e4a39b1503a7020e)
- **RSC:** [https://kopli.reactscan.net/rvm/0x4b4b30e2e7c6463b03cdffd6c42329d357205334/217](https://kopli.reactscan.net/rvm/0x4b4b30e2e7c6463b03cdffd6c42329d357205334/217)
- **Destination:** [https://sepolia.etherscan.io/tx/0xaf29c00ff7f0b17d389b9feefc52b090afd381979ecf7b989ce5aa72c69ed7be](https://sepolia.etherscan.io/tx/0xaf29c00ff7f0b17d389b9feefc52b090afd381979ecf7b989ce5aa72c69ed7be)

### **2️⃣ Buy Shares on Main Market**

- **Origin:** [https://sepolia.etherscan.io/tx/0x5a5930fad304ea303ddcc1bf4efb9c92d1f16ab6552d3e95f98c135f7ac1ed81](https://sepolia.etherscan.io/tx/0x5a5930fad304ea303ddcc1bf4efb9c92d1f16ab6552d3e95f98c135f7ac1ed81)
- **RSC:** [https://kopli.reactscan.net/rvm/0x4b4b30e2e7c6463b03cdffd6c42329d357205334/218](https://kopli.reactscan.net/rvm/0x4b4b30e2e7c6463b03cdffd6c42329d357205334/218)
- **Destination:** [https://sepolia.etherscan.io/tx/0xe182794a95e3ae5f16d5b668ac89da7580ede9dcce441d9791879f9961d8673b](https://sepolia.etherscan.io/tx/0xe182794a95e3ae5f16d5b668ac89da7580ede9dcce441d9791879f9961d8673b)

### **3️⃣ Buy Shares on Sub Market**

- **Origin:** [https://sepolia.etherscan.io/tx/0x5b393539e1711c583b0a4afb9e3601877095113ded9d476b8021d08c59598a15](https://sepolia.etherscan.io/tx/0x5b393539e1711c583b0a4afb9e3601877095113ded9d476b8021d08c59598a15)
- **RSC:** [https://kopli.reactscan.net/rvm/0x4b4b30e2e7c6463b03cdffd6c42329d357205334/219](https://kopli.reactscan.net/rvm/0x4b4b30e2e7c6463b03cdffd6c42329d357205334/219)
- **Destination:** [https://sepolia.etherscan.io/tx/0x772cd9b21b38e2d045fbbb76a5f1f19e4603306f2481123b44b16b0dacfd494e](https://sepolia.etherscan.io/tx/0x772cd9b21b38e2d045fbbb76a5f1f19e4603306f2481123b44b16b0dacfd494e)

### **4️⃣ Resolve Market**

- **Origin:** [https://sepolia.etherscan.io/tx/0x5da984ba458aadea18eafb835c4be1ae45e798a4bc41c5e8f6f99d1434e6cfc8](https://sepolia.etherscan.io/tx/0x5da984ba458aadea18eafb835c4be1ae45e798a4bc41c5e8f6f99d1434e6cfc8)
- **RSC:** [https://kopli.reactscan.net/rvm/0x4b4b30e2e7c6463b03cdffd6c42329d357205334/220](https://kopli.reactscan.net/rvm/0x4b4b30e2e7c6463b03cdffd6c42329d357205334/220)
- **Destination:** [https://sepolia.etherscan.io/tx/0x06c3e3da14d4140c98289c0a07fbb6f8c976a5376e224d1d738d0f29d3fcbdb1](https://sepolia.etherscan.io/tx/0x06c3e3da14d4140c98289c0a07fbb6f8c976a5376e224d1d738d0f29d3fcbdb1)

---

## 📜 **How RSCs Solve This Problem**

Traditional cross-chain markets require **manual bridging** and **centralized oracles**, leading to:

- **Liquidity fragmentation** (traders must move assets across chains).
- **Long confirmation times** (due to manual or off-chain relays).
- **High operational risk** (vulnerabilities in centralized bridges/oracles).

By using **Reactive Smart Contracts**, OmniBets:

- **Automates market synchronization** across chains via event-driven transactions.
- **Ensures instant cross-chain liquidity updates** without user intervention.
- **Eliminates reliance on third-party oracles**, securing market outcomes in a fully decentralized way.

---

## 🎥 **Demo Video**

Check out the demo [here](https://youtu.be/VwuhcRRxz2A)

---

## 📝 **Conclusion**

OmniBets demonstrates a **real-world, decentralized, and reactive cross-chain trading experience**, fully powered by **Reactive Smart Contracts**. By automating transactions based on blockchain events, OmniBets delivers a **seamless, trustless, and efficient** prediction market ecosystem across multiple EVM chains.
