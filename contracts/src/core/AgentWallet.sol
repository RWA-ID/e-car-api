// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title AgentWallet
/// @notice ERC-4337 compatible smart account per vehicle
contract AgentWallet is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public vehicleOwner;
    uint256 public vehicleTokenId;
    address public constant ENTRY_POINT = 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789;

    mapping(address => bool) public approvedSpenders;
    mapping(address => uint256) public spendingLimits;
    mapping(address => uint256) public spentAmounts;

    event TransactionExecuted(address indexed target, uint256 value, bytes data, bytes result);
    event SpendingLimitSet(address indexed spender, uint256 limit);
    event SpenderApproved(address indexed spender);
    event SpenderRevoked(address indexed spender);

    modifier onlyAuthorized() {
        require(
            msg.sender == owner() || msg.sender == ENTRY_POINT,
            "AgentWallet: unauthorized"
        );
        _;
    }

    constructor(address _vehicleOwner, uint256 _vehicleTokenId) Ownable(_vehicleOwner) {
        vehicleOwner = _vehicleOwner;
        vehicleTokenId = _vehicleTokenId;
    }

    receive() external payable {}

    /// @notice Execute a call from the agent wallet
    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external onlyAuthorized nonReentrant returns (bytes memory result) {
        require(target != address(0), "AgentWallet: invalid target");
        bool ok;
        (ok, result) = target.call{value: value}(data);
        require(ok, "AgentWallet: execution failed");
        emit TransactionExecuted(target, value, data, result);
    }

    /// @notice Execute a call with spending limit enforcement
    function executeWithLimit(
        address target,
        uint256 value,
        bytes calldata data,
        address token
    ) external nonReentrant returns (bytes memory result) {
        require(approvedSpenders[msg.sender], "AgentWallet: not approved spender");
        uint256 amount = token == address(0) ? value : _decodeAmount(data);
        require(
            spentAmounts[msg.sender] + amount <= spendingLimits[msg.sender],
            "AgentWallet: spending limit exceeded"
        );
        spentAmounts[msg.sender] += amount;

        bool ok;
        (ok, result) = target.call{value: value}(data);
        require(ok, "AgentWallet: execution failed");
        emit TransactionExecuted(target, value, data, result);
    }

    function setSpendingLimit(address spender, uint256 limit) external onlyOwner {
        spendingLimits[spender] = limit;
        spentAmounts[spender] = 0;
        emit SpendingLimitSet(spender, limit);
    }

    function approveSpender(address spender) external onlyOwner {
        approvedSpenders[spender] = true;
        emit SpenderApproved(spender);
    }

    function revokeSpender(address spender) external onlyOwner {
        approvedSpenders[spender] = false;
        emit SpenderRevoked(spender);
    }

    function withdrawERC20(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }

    function withdrawETH(uint256 amount) external onlyOwner {
        (bool ok, ) = owner().call{value: amount}("");
        require(ok, "AgentWallet: ETH withdraw failed");
    }

    function _decodeAmount(bytes calldata data) internal pure returns (uint256) {
        if (data.length < 68) return 0;
        return abi.decode(data[36:68], (uint256));
    }
}
