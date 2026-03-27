// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title TollGateRegistry
/// @notice Registry for toll gates with automated payment processing
contract TollGateRegistry is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct TollGate {
        string name;
        uint256 fee;
        address token;
        address operator;
        uint256 totalCollected;
        bool active;
    }

    mapping(bytes32 => TollGate) private gates;
    bytes32[] public gateIds;

    event TollGateRegistered(bytes32 indexed gateId, string name, uint256 fee, address token, address operator);
    event TollPaymentProcessed(bytes32 indexed gateId, uint256 indexed vehicleId, uint256 fee);
    event TollGateDeactivated(bytes32 indexed gateId);

    constructor() Ownable(msg.sender) {}

    function registerTollGate(
        string calldata name,
        uint256 fee,
        address token
    ) external returns (bytes32 gateId) {
        gateId = keccak256(abi.encodePacked(name, msg.sender, block.timestamp));
        gates[gateId] = TollGate({
            name: name,
            fee: fee,
            token: token,
            operator: msg.sender,
            totalCollected: 0,
            active: true
        });
        gateIds.push(gateId);
        emit TollGateRegistered(gateId, name, fee, token, msg.sender);
    }

    function processPayment(bytes32 gateId, uint256 vehicleId) external payable nonReentrant {
        TollGate storage gate = gates[gateId];
        require(gate.active, "TollGateRegistry: gate not active");

        if (gate.token == address(0)) {
            require(msg.value == gate.fee, "TollGateRegistry: wrong ETH amount");
            (bool ok, ) = gate.operator.call{value: gate.fee}("");
            require(ok, "TollGateRegistry: payment failed");
        } else {
            require(msg.value == 0, "TollGateRegistry: ETH not accepted");
            IERC20(gate.token).safeTransferFrom(msg.sender, gate.operator, gate.fee);
        }

        gate.totalCollected += gate.fee;
        emit TollPaymentProcessed(gateId, vehicleId, gate.fee);
    }

    function getGate(bytes32 gateId) external view returns (string memory name, uint256 fee, address token) {
        TollGate storage gate = gates[gateId];
        return (gate.name, gate.fee, gate.token);
    }

    function deactivateGate(bytes32 gateId) external {
        require(
            gates[gateId].operator == msg.sender || owner() == msg.sender,
            "TollGateRegistry: unauthorized"
        );
        gates[gateId].active = false;
        emit TollGateDeactivated(gateId);
    }
}
