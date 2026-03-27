// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/charging/ChargingStationRegistry.sol";
import "../src/charging/ChargingPaymentRouter.sol";

contract DeployCharging is Script {
    ChargingStationRegistry public stationRegistry;
    ChargingPaymentRouter public paymentRouter;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        address escrowAddress = vm.envOr("PAYMENT_ESCROW_ADDRESS", address(0));
        require(escrowAddress != address(0), "DeployCharging: PAYMENT_ESCROW_ADDRESS not set");

        vm.startBroadcast(deployerKey);

        stationRegistry = new ChargingStationRegistry();
        console.log("ChargingStationRegistry deployed at:", address(stationRegistry));

        paymentRouter = new ChargingPaymentRouter(address(stationRegistry), escrowAddress);
        console.log("ChargingPaymentRouter deployed at:", address(paymentRouter));

        vm.stopBroadcast();
    }
}
