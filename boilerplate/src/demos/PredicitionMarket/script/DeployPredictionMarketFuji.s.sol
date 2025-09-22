// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Script.sol";
import "../Token/MockUSDC.sol";
import "../PredictionMarket.sol";

contract DeployPredictionMarketFuji is Script {
    function run() external {
        vm.startBroadcast();

        // Deploy MockUSDC token
        MockUSDC mockUSDC = new MockUSDC("MockUSDC", "USDC");
        console.log("MockUSDC deployed to:", address(mockUSDC));
        
        // Fuji testnet callback proxy address (update this with actual Fuji callback proxy)
        address callbackProxyAddr = address(0x0000000000000000000000000000000000000000);

        // Deploy PredictionMarket with MockUSDC as price token
        PredictionMarketV2 predictionMarket = new PredictionMarketV2{value: 0.05 ether}(callbackProxyAddr, address(mockUSDC));
        console.log("PredictionMarket deployed to:", address(predictionMarket));
        console.log("Using price token at:", address(mockUSDC));

        // Mint some tokens to the deployer for testing
        address deployer = msg.sender;
        uint256 mintAmount = 1_000 * 10**18; // 1,000 tokens
        mockUSDC.mint(deployer, mintAmount);
        console.log("Minted 1,000 tokens to deployer:", deployer);

        // Approve tokens for the prediction market
        mockUSDC.approve(address(predictionMarket), type(uint256).max);
        console.log("Approved PredictionMarket to spend MockUSDC");
        
        vm.stopBroadcast();
        console.log("Deployment and setup complete!");
        console.log("Update the following addresses in your configuration:");
        console.log("USDC_ADDRESS_FUJI_A:", address(mockUSDC));
        console.log("PredictionMarketAddressFujiA:", address(predictionMarket));
    }
}
