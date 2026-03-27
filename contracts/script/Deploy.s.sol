// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "./DeployCore.s.sol";
import "./DeployNamespaces.s.sol";
import "./DeployCharging.s.sol";
import "./DeployVoice.s.sol";

/// @title Deploy
/// @notice Master deploy script — orchestrates all sub-deployments
contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        console.log("Deploying e-car.eth protocol from:", deployer);
        console.log("Chain ID:", block.chainid);

        // Deploy core contracts
        DeployCore core = new DeployCore();
        core.run();

        // Deploy namespaces
        DeployNamespaces namespaces = new DeployNamespaces();
        namespaces.run();

        // Deploy charging
        DeployCharging charging = new DeployCharging();
        charging.run();

        // Deploy voice
        DeployVoice voice = new DeployVoice();
        voice.run();

        console.log("All contracts deployed successfully.");
    }
}
