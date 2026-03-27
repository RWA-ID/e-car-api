// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @title BatteryPassport
/// @notice Merkle-proven battery lifecycle data per vehicle
contract BatteryPassport is AccessControl {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    struct PassportEntry {
        bytes32 merkleRoot;
        uint256 timestamp;
        uint256 stateOfHealth;
        uint256 cycleCount;
    }

    mapping(uint256 => PassportEntry[]) public passportHistory;

    event PassportUpdated(
        uint256 indexed vehicleId,
        bytes32 merkleRoot,
        uint256 stateOfHealth,
        uint256 cycleCount,
        uint256 timestamp
    );

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ORACLE_ROLE, admin);
    }

    /// @notice Post a new battery passport entry for a vehicle
    function updatePassport(
        uint256 vehicleId,
        bytes32 merkleRoot,
        uint256 stateOfHealth,
        uint256 cycleCount
    ) external onlyRole(ORACLE_ROLE) {
        passportHistory[vehicleId].push(PassportEntry({
            merkleRoot: merkleRoot,
            timestamp: block.timestamp,
            stateOfHealth: stateOfHealth,
            cycleCount: cycleCount
        }));
        emit PassportUpdated(vehicleId, merkleRoot, stateOfHealth, cycleCount, block.timestamp);
    }

    /// @notice Verify a leaf against the latest merkle root for a vehicle
    function verifyEntry(
        uint256 vehicleId,
        bytes32[] calldata proof,
        bytes32 leaf
    ) external view returns (bool) {
        PassportEntry[] storage entries = passportHistory[vehicleId];
        require(entries.length > 0, "BatteryPassport: no entries");
        bytes32 root = entries[entries.length - 1].merkleRoot;
        return MerkleProof.verify(proof, root, leaf);
    }

    /// @notice Get the latest merkle root for a vehicle
    function getLatestRoot(uint256 vehicleId) external view returns (bytes32) {
        PassportEntry[] storage entries = passportHistory[vehicleId];
        require(entries.length > 0, "BatteryPassport: no entries");
        return entries[entries.length - 1].merkleRoot;
    }

    /// @notice Get full passport history for a vehicle
    function getHistory(uint256 vehicleId) external view returns (PassportEntry[] memory) {
        return passportHistory[vehicleId];
    }
}
