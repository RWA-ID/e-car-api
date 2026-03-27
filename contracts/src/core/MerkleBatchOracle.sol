// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @title MerkleBatchOracle
/// @notice Posts batched data roots for various data types (telemetry, charging, etc.)
contract MerkleBatchOracle is AccessControl {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    mapping(bytes32 => bytes32) public dataRoots;
    mapping(bytes32 => uint256) public lastUpdated;

    event RootPosted(bytes32 indexed dataType, bytes32 merkleRoot, uint256 timestamp);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ORACLE_ROLE, admin);
    }

    /// @notice Post a new merkle root for a data type
    function postRoot(bytes32 dataType, bytes32 merkleRoot) external onlyRole(ORACLE_ROLE) {
        dataRoots[dataType] = merkleRoot;
        lastUpdated[dataType] = block.timestamp;
        emit RootPosted(dataType, merkleRoot, block.timestamp);
    }

    /// @notice Verify a leaf against the stored root for a data type
    function verify(
        bytes32 dataType,
        bytes32[] calldata proof,
        bytes32 leaf
    ) external view returns (bool) {
        bytes32 root = dataRoots[dataType];
        require(root != bytes32(0), "MerkleBatchOracle: no root for dataType");
        return MerkleProof.verify(proof, root, leaf);
    }

    /// @notice Get the current root for a data type
    function getRoot(bytes32 dataType) external view returns (bytes32) {
        return dataRoots[dataType];
    }
}
