// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IChargingPaymentRouter {
    event SessionInitiated(uint256 indexed sessionId, bytes32 stationId, uint256 escrowId, uint256 estimatedKwh);
    event SessionFinalized(uint256 indexed sessionId, uint256 actualKwh, uint256 totalCost);

    function initiateChargingSession(
        bytes32 stationId,
        uint256 estimatedKwh,
        address token
    ) external payable returns (uint256 escrowId);

    function finalizeSession(uint256 escrowId, uint256 actualKwh) external;

    function getSessionCost(bytes32 stationId, uint256 kwh) external view returns (uint256);
}
