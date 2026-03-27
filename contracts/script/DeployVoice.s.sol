// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/voice/VoiceRampRouter.sol";

contract DeployVoice is Script {
    VoiceRampRouter public voiceRouter;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);

        voiceRouter = new VoiceRampRouter();
        console.log("VoiceRampRouter deployed at:", address(voiceRouter));

        vm.stopBroadcast();
    }
}
