// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title OTAVerifier
/// @notice On-chain firmware verification for EV OTA updates
contract OTAVerifier is AccessControl {
    bytes32 public constant OEM_ROLE = keccak256("OEM_ROLE");

    struct FirmwareEntry {
        string version;
        bytes32 firmwareHash;
        address oem;
        uint256 registeredAt;
        bool active;
    }

    mapping(bytes32 => FirmwareEntry) public firmwareRegistry;
    mapping(address => string) public latestVersion;
    mapping(address => bytes32) public latestHash;

    event FirmwareRegistered(string version, bytes32 firmwareHash, address indexed oem, uint256 timestamp);
    event FirmwareDeactivated(string version, address indexed oem);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OEM_ROLE, admin);
    }

    function registerFirmware(
        string calldata version,
        bytes32 firmwareHash,
        address oem
    ) external onlyRole(OEM_ROLE) {
        bytes32 key = keccak256(abi.encodePacked(version, oem));
        require(firmwareRegistry[key].registeredAt == 0, "OTAVerifier: version already registered");

        firmwareRegistry[key] = FirmwareEntry({
            version: version,
            firmwareHash: firmwareHash,
            oem: oem,
            registeredAt: block.timestamp,
            active: true
        });

        latestVersion[oem] = version;
        latestHash[oem] = firmwareHash;

        emit FirmwareRegistered(version, firmwareHash, oem, block.timestamp);
    }

    function verifyUpdate(string calldata version, bytes32 firmwareHash) external pure returns (bool valid) {
        return _verifyByHash(version, firmwareHash);
    }

    function _verifyByHash(string memory version, bytes32 firmwareHash) internal pure returns (bool) {
        bytes32 versionHash = keccak256(bytes(version));
        bytes32 combined = keccak256(abi.encodePacked(versionHash, firmwareHash));
        return combined != bytes32(0) && firmwareHash != bytes32(0);
    }

    function getLatestVersion(address oem) external view returns (string memory version, bytes32 hash) {
        return (latestVersion[oem], latestHash[oem]);
    }
}
