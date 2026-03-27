// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title ParkingPayment
/// @notice On-chain parking session management and payment
contract ParkingPayment is Ownable, ReentrancyGuard {
    struct ParkingSession {
        uint256 vehicleId;
        bytes32 spotId;
        uint256 ratePerHour;
        address payer;
        uint256 startTime;
        uint256 endTime;
        bool active;
        uint256 cost;
    }

    mapping(uint256 => ParkingSession) public sessions;
    mapping(bytes32 => bool) public spotOccupied;
    uint256 public sessionCount;

    address public treasury;
    uint256 public platformFeeBps = 100; // 1%

    event ParkingStarted(uint256 indexed sessionId, uint256 vehicleId, bytes32 spotId, uint256 ratePerHour);
    event ParkingEnded(uint256 indexed sessionId, uint256 duration, uint256 cost);

    constructor(address _treasury) Ownable(msg.sender) {
        treasury = _treasury;
    }

    function startParking(
        uint256 vehicleId,
        bytes32 spotId,
        uint256 ratePerHour
    ) external returns (uint256 sessionId) {
        require(!spotOccupied[spotId], "ParkingPayment: spot occupied");

        sessionId = ++sessionCount;
        sessions[sessionId] = ParkingSession({
            vehicleId: vehicleId,
            spotId: spotId,
            ratePerHour: ratePerHour,
            payer: msg.sender,
            startTime: block.timestamp,
            endTime: 0,
            active: true,
            cost: 0
        });

        spotOccupied[spotId] = true;
        emit ParkingStarted(sessionId, vehicleId, spotId, ratePerHour);
    }

    function endParking(uint256 sessionId) external payable nonReentrant {
        ParkingSession storage session = sessions[sessionId];
        require(session.active, "ParkingPayment: session not active");
        require(session.payer == msg.sender || owner() == msg.sender, "ParkingPayment: unauthorized");

        session.active = false;
        session.endTime = block.timestamp;

        uint256 duration = session.endTime - session.startTime;
        uint256 hours_ = (duration + 3599) / 3600; // round up
        uint256 cost = hours_ * session.ratePerHour;
        session.cost = cost;

        spotOccupied[session.spotId] = false;

        if (cost > 0 && msg.value >= cost) {
            uint256 fee = (cost * platformFeeBps) / 10000;
            uint256 refund = msg.value - cost;

            if (fee > 0) {
                (bool ok1, ) = treasury.call{value: fee}("");
                require(ok1, "ParkingPayment: fee transfer failed");
            }

            if (refund > 0) {
                (bool ok2, ) = msg.sender.call{value: refund}("");
                require(ok2, "ParkingPayment: refund failed");
            }
        }

        emit ParkingEnded(sessionId, duration, cost);
    }

    function getSessionCost(uint256 sessionId) external view returns (uint256) {
        ParkingSession storage session = sessions[sessionId];
        if (!session.active) return session.cost;
        uint256 duration = block.timestamp - session.startTime;
        uint256 hours_ = (duration + 3599) / 3600;
        return hours_ * session.ratePerHour;
    }
}
