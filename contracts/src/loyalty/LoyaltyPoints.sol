// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title LoyaltyPoints
/// @notice ERC-20 loyalty token per OEM with staking functionality
contract LoyaltyPoints is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    string public oem;
    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public stakeTimestamp;
    uint256 public totalStaked;

    event PointsMinted(address indexed to, uint256 amount);
    event PointsBurned(address indexed from, uint256 amount);
    event Staked(address indexed staker, uint256 amount);
    event Unstaked(address indexed staker, uint256 amount);

    constructor(string memory _oem, address admin) ERC20(
        string(abi.encodePacked(_oem, " Loyalty Points")),
        string(abi.encodePacked(_oem, "LP"))
    ) {
        oem = _oem;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
    }

    function mintPoints(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
        emit PointsMinted(to, amount);
    }

    function burnPoints(uint256 amount) external {
        _burn(msg.sender, amount);
        emit PointsBurned(msg.sender, amount);
    }

    function stake(uint256 amount) external {
        require(amount > 0, "LoyaltyPoints: amount must be > 0");
        require(balanceOf(msg.sender) >= amount, "LoyaltyPoints: insufficient balance");
        _transfer(msg.sender, address(this), amount);
        stakedBalance[msg.sender] += amount;
        stakeTimestamp[msg.sender] = block.timestamp;
        totalStaked += amount;
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external {
        require(stakedBalance[msg.sender] >= amount, "LoyaltyPoints: insufficient staked");
        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;
        _transfer(address(this), msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    function getStakeInfo(address staker) external view returns (uint256 staked, uint256 since) {
        return (stakedBalance[staker], stakeTimestamp[staker]);
    }
}
