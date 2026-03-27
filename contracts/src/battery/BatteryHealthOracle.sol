// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title BatteryHealthOracle
/// @notice Posts State of Health (SoH) scores on-chain for vehicle batteries
contract BatteryHealthOracle is AccessControl {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    struct HealthReport {
        uint256 vehicleId;
        uint256 soh;
        uint256 timestamp;
        bytes32 dataHash;
    }

    mapping(uint256 => HealthReport[]) private reports;
    mapping(uint256 => HealthReport) public latestReport;

    event ReportPosted(uint256 indexed vehicleId, uint256 soh, bytes32 dataHash, uint256 timestamp);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ORACLE_ROLE, admin);
    }

    /// @notice Post a new battery health report for a vehicle
    function postReport(
        uint256 vehicleId,
        uint256 soh,
        bytes32 dataHash
    ) external onlyRole(ORACLE_ROLE) {
        require(soh <= 100, "BatteryHealthOracle: SoH must be <= 100");
        HealthReport memory report = HealthReport({
            vehicleId: vehicleId,
            soh: soh,
            timestamp: block.timestamp,
            dataHash: dataHash
        });
        reports[vehicleId].push(report);
        latestReport[vehicleId] = report;
        emit ReportPosted(vehicleId, soh, dataHash, block.timestamp);
    }

    function getLatestReport(uint256 vehicleId) external view returns (HealthReport memory) {
        require(reports[vehicleId].length > 0, "BatteryHealthOracle: no reports");
        return latestReport[vehicleId];
    }

    function getHistory(uint256 vehicleId) external view returns (HealthReport[] memory) {
        return reports[vehicleId];
    }
}
