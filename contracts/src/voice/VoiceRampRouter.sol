// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title VoiceRampRouter
/// @notice Routes voice commands to on-chain actions and manages ramp providers
contract VoiceRampRouter is Ownable {
    struct RampProvider {
        string name;
        address provider;
        bool active;
    }

    mapping(string => RampProvider) public rampProviders;
    string[] public providerNames;

    // Intent registry: intent string => handler contract address
    mapping(bytes32 => address) public intentHandlers;

    event IntentProcessed(string intent, address caller, bytes result);
    event RampProviderRegistered(string name, address provider);
    event RampProviderDeactivated(string name);
    event IntentHandlerRegistered(bytes32 indexed intentHash, address handler);

    constructor() Ownable(msg.sender) {}

    /// @notice Process a voice intent on-chain
    function processIntent(
        string calldata intent,
        bytes calldata payload
    ) external returns (bytes memory result) {
        bytes32 intentHash = keccak256(bytes(intent));
        address handler = intentHandlers[intentHash];

        if (handler != address(0)) {
            bool ok;
            (ok, result) = handler.call(payload);
            require(ok, "VoiceRampRouter: intent execution failed");
        } else {
            // Return encoded acknowledgment for unregistered intents
            result = abi.encode(intent, "unhandled");
        }

        emit IntentProcessed(intent, msg.sender, result);
    }

    function registerRampProvider(string calldata name, address provider) external onlyOwner {
        require(provider != address(0), "VoiceRampRouter: zero address");
        require(!rampProviders[name].active, "VoiceRampRouter: provider already registered");

        rampProviders[name] = RampProvider({name: name, provider: provider, active: true});
        providerNames.push(name);

        emit RampProviderRegistered(name, provider);
    }

    function deactivateRampProvider(string calldata name) external onlyOwner {
        rampProviders[name].active = false;
        emit RampProviderDeactivated(name);
    }

    function registerIntentHandler(string calldata intent, address handler) external onlyOwner {
        bytes32 intentHash = keccak256(bytes(intent));
        intentHandlers[intentHash] = handler;
        emit IntentHandlerRegistered(intentHash, handler);
    }

    function getRampProvider(string calldata name) external view returns (address) {
        require(rampProviders[name].active, "VoiceRampRouter: provider not active");
        return rampProviders[name].provider;
    }

    function getProviderNames() external view returns (string[] memory) {
        return providerNames;
    }
}
