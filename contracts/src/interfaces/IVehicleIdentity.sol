// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IVehicleIdentity {
    struct VehicleData {
        bytes32 vinHash;
        string manufacturer;
        string model;
        uint16 year;
        uint256 batteryCapacityKwh;
        uint256 registrationDate;
        bool transferApproved;
    }

    event VehicleRegistered(uint256 indexed tokenId, bytes32 vinHash, string manufacturer, string model, uint16 year);
    event VehicleTransferred(uint256 indexed tokenId, address newOwner);

    function registerVehicle(
        bytes32 vinHash,
        string calldata manufacturer,
        string calldata model,
        uint16 year,
        uint256 batteryKwh
    ) external returns (uint256 tokenId);

    function transferVehicle(uint256 tokenId, address newOwner) external;

    function getVehicle(uint256 tokenId) external view returns (VehicleData memory);

    function locked(uint256 tokenId) external view returns (bool);

    function ownerOf(uint256 tokenId) external view returns (address);
}
