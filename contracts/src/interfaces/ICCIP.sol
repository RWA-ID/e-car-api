// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title ICCIP
/// @notice CCIP-Read (EIP-3668) interface for off-chain lookups
interface ICCIP {
    /// @notice Thrown to trigger an off-chain lookup
    error OffchainLookup(
        address sender,
        string[] urls,
        bytes callData,
        bytes4 callbackFunction,
        bytes extraData
    );
}
