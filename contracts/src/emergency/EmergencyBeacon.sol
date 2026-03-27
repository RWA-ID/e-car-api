// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title EmergencyBeacon
/// @notice On-chain emergency broadcast for EV accidents
contract EmergencyBeacon is Ownable {
    struct Beacon {
        uint256 vehicleId;
        bytes locationData;
        bytes32 accidentHash;
        address broadcaster;
        uint256 timestamp;
        bool resolved;
    }

    mapping(uint256 => Beacon) public beacons;
    uint256 public beaconCount;
    uint256[] private activeBeaconIds;
    mapping(uint256 => uint256) private activeBeaconIndex;

    event EmergencyBroadcast(uint256 indexed beaconId, uint256 indexed vehicleId, bytes32 accidentHash, uint256 timestamp);
    event EmergencyResolved(uint256 indexed beaconId, uint256 resolvedAt);

    constructor() Ownable(msg.sender) {}

    function broadcastEmergency(
        uint256 vehicleId,
        bytes calldata locationData,
        bytes32 accidentHash
    ) external {
        uint256 beaconId = ++beaconCount;
        beacons[beaconId] = Beacon({
            vehicleId: vehicleId,
            locationData: locationData,
            accidentHash: accidentHash,
            broadcaster: msg.sender,
            timestamp: block.timestamp,
            resolved: false
        });

        activeBeaconIndex[beaconId] = activeBeaconIds.length;
        activeBeaconIds.push(beaconId);

        emit EmergencyBroadcast(beaconId, vehicleId, accidentHash, block.timestamp);
    }

    function resolveEmergency(uint256 beaconId) external {
        require(
            beacons[beaconId].broadcaster == msg.sender || owner() == msg.sender,
            "EmergencyBeacon: unauthorized"
        );
        require(!beacons[beaconId].resolved, "EmergencyBeacon: already resolved");
        beacons[beaconId].resolved = true;

        // Remove from active list by swap and pop
        uint256 idx = activeBeaconIndex[beaconId];
        uint256 lastId = activeBeaconIds[activeBeaconIds.length - 1];
        activeBeaconIds[idx] = lastId;
        activeBeaconIndex[lastId] = idx;
        activeBeaconIds.pop();
        delete activeBeaconIndex[beaconId];

        emit EmergencyResolved(beaconId, block.timestamp);
    }

    function getActiveBeacons() external view returns (uint256[] memory) {
        return activeBeaconIds;
    }

    function getBeacon(uint256 beaconId) external view returns (Beacon memory) {
        return beacons[beaconId];
    }
}
