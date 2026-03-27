// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title V2GSettlement
/// @notice Vehicle-to-Grid energy settlement contract
contract V2GSettlement is Ownable, ReentrancyGuard {
    struct V2GSession {
        uint256 vehicleId;
        uint256 energyKwh;
        uint256 pricePerKwh;
        address provider;
        bool settled;
        uint256 earnings;
        uint256 startedAt;
        uint256 settledAt;
    }

    mapping(uint256 => V2GSession) public sessions;
    uint256 public sessionCount;

    address public gridOracle;
    uint256 public platformFeeBps = 100; // 1%

    event V2GSessionRegistered(uint256 indexed sessionId, uint256 vehicleId, uint256 energyKwh, uint256 pricePerKwh);
    event V2GSessionSettled(uint256 indexed sessionId, uint256 earnings);

    constructor(address _gridOracle) Ownable(msg.sender) {
        gridOracle = _gridOracle;
    }

    function registerV2GSession(
        uint256 vehicleId,
        uint256 energyKwh,
        uint256 pricePerKwh
    ) external returns (uint256 sessionId) {
        sessionId = ++sessionCount;
        sessions[sessionId] = V2GSession({
            vehicleId: vehicleId,
            energyKwh: energyKwh,
            pricePerKwh: pricePerKwh,
            provider: msg.sender,
            settled: false,
            earnings: 0,
            startedAt: block.timestamp,
            settledAt: 0
        });
        emit V2GSessionRegistered(sessionId, vehicleId, energyKwh, pricePerKwh);
    }

    function settleSession(uint256 sessionId) external payable nonReentrant {
        V2GSession storage session = sessions[sessionId];
        require(!session.settled, "V2GSettlement: already settled");
        require(
            msg.sender == gridOracle || msg.sender == owner(),
            "V2GSettlement: unauthorized"
        );

        uint256 grossEarnings = session.energyKwh * session.pricePerKwh;
        uint256 fee = (grossEarnings * platformFeeBps) / 10000;
        uint256 netEarnings = grossEarnings - fee;

        session.settled = true;
        session.earnings = netEarnings;
        session.settledAt = block.timestamp;

        if (address(this).balance >= netEarnings) {
            (bool ok, ) = session.provider.call{value: netEarnings}("");
            require(ok, "V2GSettlement: payment failed");
        }

        emit V2GSessionSettled(sessionId, netEarnings);
    }

    function getSessionEarnings(uint256 sessionId) external view returns (uint256) {
        return sessions[sessionId].earnings;
    }

    function setGridOracle(address _oracle) external onlyOwner {
        gridOracle = _oracle;
    }

    receive() external payable {}
}
