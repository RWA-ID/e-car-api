// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IBatteryPassport {
    struct PassportEntry {
        bytes32 merkleRoot;
        uint256 timestamp;
        uint256 stateOfHealth;
        uint256 cycleCount;
    }

    event PassportUpdated(
        uint256 indexed vehicleId,
        bytes32 merkleRoot,
        uint256 stateOfHealth,
        uint256 cycleCount,
        uint256 timestamp
    );

    function updatePassport(
        uint256 vehicleId,
        bytes32 merkleRoot,
        uint256 stateOfHealth,
        uint256 cycleCount
    ) external;

    function verifyEntry(
        uint256 vehicleId,
        bytes32[] calldata proof,
        bytes32 leaf
    ) external view returns (bool);

    function getLatestRoot(uint256 vehicleId) external view returns (bytes32);

    function getHistory(uint256 vehicleId) external view returns (PassportEntry[] memory);
}
