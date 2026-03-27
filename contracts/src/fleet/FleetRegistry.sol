// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title FleetRegistry
/// @notice Manages EV fleets with geofencing and vehicle tracking
contract FleetRegistry is Ownable {
    struct Fleet {
        string name;
        address manager;
        address[] vehicles;
        bytes geofenceData;
        uint256 createdAt;
        bool active;
    }

    mapping(bytes32 => Fleet) private fleets;
    mapping(bytes32 => mapping(address => bool)) public isVehicleInFleet;
    bytes32[] public fleetIds;

    event FleetRegistered(bytes32 indexed fleetId, string name, address manager);
    event VehicleAdded(bytes32 indexed fleetId, address vehicleAgent);
    event VehicleRemoved(bytes32 indexed fleetId, address vehicleAgent);
    event GeofenceUpdated(bytes32 indexed fleetId);

    constructor() Ownable(msg.sender) {}

    function registerFleet(string calldata name, address[] calldata vehicles)
        external
        returns (bytes32 fleetId)
    {
        fleetId = keccak256(abi.encodePacked(name, msg.sender, block.timestamp));
        require(fleets[fleetId].createdAt == 0, "FleetRegistry: fleet exists");

        Fleet storage fleet = fleets[fleetId];
        fleet.name = name;
        fleet.manager = msg.sender;
        fleet.createdAt = block.timestamp;
        fleet.active = true;

        for (uint256 i = 0; i < vehicles.length; i++) {
            fleet.vehicles.push(vehicles[i]);
            isVehicleInFleet[fleetId][vehicles[i]] = true;
        }

        fleetIds.push(fleetId);
        emit FleetRegistered(fleetId, name, msg.sender);
    }

    function addVehicle(bytes32 fleetId, address vehicleAgent) external {
        require(fleets[fleetId].manager == msg.sender, "FleetRegistry: not manager");
        require(!isVehicleInFleet[fleetId][vehicleAgent], "FleetRegistry: already in fleet");
        fleets[fleetId].vehicles.push(vehicleAgent);
        isVehicleInFleet[fleetId][vehicleAgent] = true;
        emit VehicleAdded(fleetId, vehicleAgent);
    }

    function removeVehicle(bytes32 fleetId, address vehicleAgent) external {
        require(fleets[fleetId].manager == msg.sender, "FleetRegistry: not manager");
        require(isVehicleInFleet[fleetId][vehicleAgent], "FleetRegistry: not in fleet");

        isVehicleInFleet[fleetId][vehicleAgent] = false;
        address[] storage vehicles = fleets[fleetId].vehicles;
        for (uint256 i = 0; i < vehicles.length; i++) {
            if (vehicles[i] == vehicleAgent) {
                vehicles[i] = vehicles[vehicles.length - 1];
                vehicles.pop();
                break;
            }
        }
        emit VehicleRemoved(fleetId, vehicleAgent);
    }

    function setGeofence(bytes32 fleetId, bytes calldata geofenceData) external {
        require(fleets[fleetId].manager == msg.sender, "FleetRegistry: not manager");
        fleets[fleetId].geofenceData = geofenceData;
        emit GeofenceUpdated(fleetId);
    }

    function getFleet(bytes32 fleetId) external view returns (address[] memory) {
        return fleets[fleetId].vehicles;
    }

    function getFleetInfo(bytes32 fleetId) external view returns (string memory name, address manager, bool active) {
        Fleet storage fleet = fleets[fleetId];
        return (fleet.name, fleet.manager, fleet.active);
    }
}
