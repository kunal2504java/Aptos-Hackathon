// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Script.sol";
import "../Token/MockUSDC.sol";
import "../PredicitionMarketSepolia.sol";

contract DeploySubPredictionMarketFuji is Script {
    function run() external {
        vm.startBroadcast();

        // Deploy MockUSDC token
        MockUSDC mockUSDC = new MockUSDC("MockUSDC", "USDC");
        console.log("MockUSDC deployed to:", address(mockUSDC));

        // Fuji testnet callback proxy address (update this with actual Fuji callback proxy)
        address callbackProxyAddr = address(0x0000000000000000000000000000000000000000);
        console.log("Using callback sender:", callbackProxyAddr);

        // Deploy PredictionMarketSepolia with MockUSDC as price token
        PredictionMarketSepolia predictionMarket = new PredictionMarketSepolia{value: 0.02 ether}(
            callbackProxyAddr,
            address(mockUSDC),
            msg.sender // Use deployer as burner address
        );
        console.log("PredictionMarketFuji deployed to:", address(predictionMarket));
        console.log("Using price token at:", address(mockUSDC));

        // Mint some tokens to the deployer for testing
        address deployer = msg.sender;
        uint256 mintAmount = 1_000 * 10**18; // 1,000 tokens
        mockUSDC.mint(deployer, mintAmount);
        console.log("Minted 1,000 tokens to deployer:", deployer);

        // Approve tokens for the prediction market
        mockUSDC.approve(address(predictionMarket), type(uint256).max);
        console.log("Approved PredictionMarketFuji to spend MockUSDC");

        vm.stopBroadcast();
        console.log("Deployment and setup complete!");
        console.log("Update the following addresses in your configuration:");
        console.log("USDC_ADDRESS_FUJI_B:", address(mockUSDC));
        console.log("PredictionMarketAddressFujiB:", address(predictionMarket));
    }
}
