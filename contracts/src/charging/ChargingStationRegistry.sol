// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ChargingStationRegistry
/// @notice Registry for EV charging stations with ENS-based identifiers
contract ChargingStationRegistry is Ownable {
    struct Station {
        string id;
        string brand;
        bytes32 ensNode;
        address operator;
        uint256 pricePerKwh;
        bool active;
    }

    mapping(bytes32 => Station) public stations;
    uint256 public stationCount;

    event StationRegistered(bytes32 indexed nodeId, string stationId, string brand, address operator, uint256 pricePerKwh);
    event PriceUpdated(bytes32 indexed nodeId, uint256 newPrice);
    event StationDeactivated(bytes32 indexed nodeId);
    event StationReactivated(bytes32 indexed nodeId);

    constructor() Ownable(msg.sender) {}

    /// @notice Register a new charging station
    function registerStation(
        string calldata stationId,
        string calldata brand,
        uint256 pricePerKwh
    ) external returns (bytes32 nodeId) {
        nodeId = keccak256(abi.encodePacked(stationId, brand, msg.sender));
        require(!stations[nodeId].active, "ChargingStationRegistry: station exists");

        stations[nodeId] = Station({
            id: stationId,
            brand: brand,
            ensNode: nodeId,
            operator: msg.sender,
            pricePerKwh: pricePerKwh,
            active: true
        });
        stationCount++;

        emit StationRegistered(nodeId, stationId, brand, msg.sender, pricePerKwh);
    }

    function updatePrice(bytes32 nodeId, uint256 newPrice) external {
        require(stations[nodeId].operator == msg.sender, "ChargingStationRegistry: not operator");
        require(stations[nodeId].active, "ChargingStationRegistry: station not active");
        stations[nodeId].pricePerKwh = newPrice;
        emit PriceUpdated(nodeId, newPrice);
    }

    function deactivateStation(bytes32 nodeId) external {
        require(
            stations[nodeId].operator == msg.sender || owner() == msg.sender,
            "ChargingStationRegistry: unauthorized"
        );
        stations[nodeId].active = false;
        emit StationDeactivated(nodeId);
    }

    function getStation(bytes32 nodeId) external view returns (Station memory) {
        return stations[nodeId];
    }
}
