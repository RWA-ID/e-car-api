// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../../src/core/AgentWallet.sol";

// Simple target contract for testing
contract MockTarget {
    uint256 public value;
    function setValue(uint256 v) external {
        value = v;
    }
    receive() external payable {}
}

contract AgentWalletTest is Test {
    receive() external payable {}
    AgentWallet public wallet;
    MockTarget public target;
    address public owner_ = address(this);
    address public spender = address(0x5F3D);
    address public unauthorized = address(0xBAD);

    function setUp() public {
        wallet = new AgentWallet(owner_, 1);
        target = new MockTarget();
        vm.deal(address(wallet), 5 ether);
    }

    function test_executeAsOwner() public {
        bytes memory callData = abi.encodeWithSignature("setValue(uint256)", 42);
        wallet.execute(address(target), 0, callData);
        assertEq(target.value(), 42);
    }

    function test_executeUnauthorizedReverts() public {
        bytes memory callData = abi.encodeWithSignature("setValue(uint256)", 99);
        vm.prank(unauthorized);
        vm.expectRevert("AgentWallet: unauthorized");
        wallet.execute(address(target), 0, callData);
    }

    function test_spendingLimit() public {
        wallet.approveSpender(spender);
        wallet.setSpendingLimit(spender, 1 ether);

        assertEq(wallet.spendingLimits(spender), 1 ether);
        assertTrue(wallet.approvedSpenders(spender));
    }

    function test_revokeSpender() public {
        wallet.approveSpender(spender);
        assertTrue(wallet.approvedSpenders(spender));

        wallet.revokeSpender(spender);
        assertFalse(wallet.approvedSpenders(spender));
    }

    function test_withdrawETH() public {
        uint256 before = owner_.balance;
        wallet.withdrawETH(1 ether);
        assertEq(owner_.balance, before + 1 ether);
    }

    function test_vehicleData() public view {
        assertEq(wallet.vehicleOwner(), owner_);
        assertEq(wallet.vehicleTokenId(), 1);
    }
}
