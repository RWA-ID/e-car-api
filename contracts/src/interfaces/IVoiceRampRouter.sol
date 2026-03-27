// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IVoiceRampRouter {
    event IntentProcessed(string intent, address caller, bytes result);
    event RampProviderRegistered(string name, address provider);
    event IntentHandlerRegistered(bytes32 indexed intentHash, address handler);

    function processIntent(string calldata intent, bytes calldata payload) external returns (bytes memory result);

    function registerRampProvider(string calldata name, address provider) external;

    function getRampProvider(string calldata name) external view returns (address);

    function registerIntentHandler(string calldata intent, address handler) external;
}
