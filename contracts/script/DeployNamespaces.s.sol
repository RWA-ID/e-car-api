// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/namespace/NamespaceGovernorFactory.sol";
import "../src/namespace/MultiSigFactory.sol";

contract DeployNamespaces is Script {
    NamespaceGovernorFactory public namespaceFactory;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);

        namespaceFactory = new NamespaceGovernorFactory();
        console.log("NamespaceGovernorFactory deployed at:", address(namespaceFactory));
        console.log("MultiSigFactory deployed at:", address(namespaceFactory.multiSigFactory()));

        vm.stopBroadcast();
    }
}
