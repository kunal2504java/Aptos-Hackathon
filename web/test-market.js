const { Aptos, AptosConfig, Network } = require("@aptos-labs/ts-sdk");

const config = new AptosConfig({ 
  network: Network.TESTNET 
});

const aptosClient = new Aptos(config);

const CONTRACT_ADDRESSES = {
  PREDICTION_MARKET: "0x33d6e8e9a87668b0a28a7beefda9a3982fb19353828722f6cc2bffdbbd4e6d23",
};

const MODULE_NAMES = {
  PREDICTION_MARKET: `${CONTRACT_ADDRESSES.PREDICTION_MARKET}::prediction_market`,
};

async function checkMarket() {
  try {
    const marketPayload = {
      function: `${MODULE_NAMES.PREDICTION_MARKET}::get_market`,
      arguments: [1],
    };

    const marketResponse = await aptosClient.view({
      payload: marketPayload,
    });

    console.log("Market data:", {
      id: marketResponse[0],
      question: marketResponse[1],
      end_time: marketResponse[2],
      total_staked: marketResponse[3],
      total_yes: marketResponse[4],
      total_no: marketResponse[5],
      state: marketResponse[6],
      won: marketResponse[7],
      creator: marketResponse[8],
      yes_quantity: marketResponse[9],
      no_quantity: marketResponse[10],
      liquidity_initialized: marketResponse[11],
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

checkMarket();
