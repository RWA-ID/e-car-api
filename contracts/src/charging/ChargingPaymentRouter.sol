// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ChargingStationRegistry.sol";
import "../core/UniversalPaymentEscrow.sol";

/// @title ChargingPaymentRouter
/// @notice Routes charging payments through the universal escrow
contract ChargingPaymentRouter is Ownable, ReentrancyGuard {
    ChargingStationRegistry public registry;
    UniversalPaymentEscrow public escrow;
    uint256 public feeBps = 30;

    struct Session {
        bytes32 stationId;
        uint256 escrowId;
        address user;
        uint256 estimatedKwh;
        uint256 actualKwh;
        bool finalized;
    }

    mapping(uint256 => Session) public sessions;
    uint256 public sessionCount;

    event SessionInitiated(uint256 indexed sessionId, bytes32 stationId, uint256 escrowId, uint256 estimatedKwh);
    event SessionFinalized(uint256 indexed sessionId, uint256 actualKwh, uint256 totalCost);

    modifier onlyOracle() {
        require(msg.sender == owner(), "ChargingPaymentRouter: not oracle");
        _;
    }

    constructor(address _registry, address _escrow) Ownable(msg.sender) {
        registry = ChargingStationRegistry(_registry);
        escrow = UniversalPaymentEscrow(payable(_escrow));
    }

    /// @notice Initiate a charging session with estimated kWh
    function initiateChargingSession(
        bytes32 stationId,
        uint256 estimatedKwh,
        address token
    ) external payable nonReentrant returns (uint256 escrowId) {
        ChargingStationRegistry.Station memory station = registry.getStation(stationId);
        require(station.active, "ChargingPaymentRouter: station not active");

        uint256 estimatedCost = station.pricePerKwh * estimatedKwh;

        if (token == address(0)) {
            escrowId = escrow.createEscrow{value: estimatedCost}(
                station.operator,
                estimatedCost,
                address(0),
                UniversalPaymentEscrow.PaymentType.CHARGING
            );
        } else {
            escrowId = escrow.createEscrow(
                station.operator,
                estimatedCost,
                token,
                UniversalPaymentEscrow.PaymentType.CHARGING
            );
        }

        uint256 sessionId = ++sessionCount;
        sessions[sessionId] = Session({
            stationId: stationId,
            escrowId: escrowId,
            user: msg.sender,
            estimatedKwh: estimatedKwh,
            actualKwh: 0,
            finalized: false
        });

        emit SessionInitiated(sessionId, stationId, escrowId, estimatedKwh);
    }

    /// @notice Finalize session with actual kWh consumed
    function finalizeSession(uint256 sessionId, uint256 actualKwh) external onlyOracle {
        Session storage session = sessions[sessionId];
        require(!session.finalized, "ChargingPaymentRouter: already finalized");

        session.actualKwh = actualKwh;
        session.finalized = true;

        ChargingStationRegistry.Station memory station = registry.getStation(session.stationId);
        uint256 totalCost = station.pricePerKwh * actualKwh;

        escrow.releaseEscrow(session.escrowId);

        emit SessionFinalized(sessionId, actualKwh, totalCost);
    }

    function getSessionCost(bytes32 stationId, uint256 kwh) external view returns (uint256) {
        ChargingStationRegistry.Station memory station = registry.getStation(stationId);
        return station.pricePerKwh * kwh;
    }

    function setFeeBps(uint256 newFee) external onlyOwner {
        feeBps = newFee;
    }
}
