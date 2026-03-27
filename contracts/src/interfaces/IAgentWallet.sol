// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAgentWallet {
    event TransactionExecuted(address indexed target, uint256 value, bytes data, bytes result);
    event SpendingLimitSet(address indexed spender, uint256 limit);
    event SpenderApproved(address indexed spender);
    event SpenderRevoked(address indexed spender);

    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external returns (bytes memory result);

    function setSpendingLimit(address spender, uint256 limit) external;

    function approveSpender(address spender) external;

    function revokeSpender(address spender) external;

    function withdrawERC20(address token, uint256 amount) external;

    function withdrawETH(uint256 amount) external;

    function vehicleOwner() external view returns (address);

    function vehicleTokenId() external view returns (uint256);

    function approvedSpenders(address spender) external view returns (bool);

    function spendingLimits(address spender) external view returns (uint256);
}
