// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/core/VehicleIdentity.sol";
import "../src/core/BatteryPassport.sol";
import "../src/core/UniversalPaymentEscrow.sol";
import "../src/core/AgentWallet.sol";
import "../src/core/MerkleBatchOracle.sol";

contract DeployCore is Script {
    VehicleIdentity public vehicleIdentity;
    BatteryPassport public batteryPassport;
    UniversalPaymentEscrow public paymentEscrow;
    AgentWallet public agentWalletImpl;
    MerkleBatchOracle public merkleBatchOracle;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        // Deploy VehicleIdentity
        vehicleIdentity = new VehicleIdentity(deployer);
        console.log("VehicleIdentity deployed at:", address(vehicleIdentity));

        // Deploy BatteryPassport
        batteryPassport = new BatteryPassport(deployer);
        console.log("BatteryPassport deployed at:", address(batteryPassport));

        // Deploy UniversalPaymentEscrow with deployer as treasury
        paymentEscrow = new UniversalPaymentEscrow(deployer);
        console.log("UniversalPaymentEscrow deployed at:", address(paymentEscrow));

        // Deploy AgentWallet implementation
        agentWalletImpl = new AgentWallet(deployer, 0);
        console.log("AgentWallet impl deployed at:", address(agentWalletImpl));

        // Deploy MerkleBatchOracle
        merkleBatchOracle = new MerkleBatchOracle(deployer);
        console.log("MerkleBatchOracle deployed at:", address(merkleBatchOracle));

        vm.stopBroadcast();
    }
}
