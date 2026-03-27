// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../../src/core/UniversalPaymentEscrow.sol";

contract UniversalPaymentEscrowTest is Test {
    UniversalPaymentEscrow public escrow;
    address public treasury = address(0x7EA5);
    address public payer = address(0xFA11);
    address public payee = address(0xCAFE);

    function setUp() public {
        escrow = new UniversalPaymentEscrow(treasury);
        vm.deal(payer, 10 ether);
    }

    function test_createAndReleaseEscrow_ETH() public {
        uint256 amount = 1 ether;
        uint256 payeeBefore = payee.balance;
        uint256 treasuryBefore = treasury.balance;

        vm.prank(payer);
        uint256 escrowId = escrow.createEscrow{value: amount}(
            payee,
            amount,
            address(0),
            UniversalPaymentEscrow.PaymentType.CHARGING
        );

        assertEq(escrowId, 1);

        vm.prank(payer);
        escrow.releaseEscrow(escrowId);

        uint256 expectedFee = (amount * 30) / 10000; // 0.3%
        uint256 expectedPayout = amount - expectedFee;

        assertEq(payee.balance, payeeBefore + expectedPayout);
        assertEq(treasury.balance, treasuryBefore + expectedFee);
    }

    function test_refundEscrow() public {
        uint256 amount = 2 ether;
        uint256 payerBefore = payer.balance;

        vm.prank(payer);
        uint256 escrowId = escrow.createEscrow{value: amount}(
            payee,
            amount,
            address(0),
            UniversalPaymentEscrow.PaymentType.PARKING
        );

        // Owner refunds
        escrow.refundEscrow(escrowId);

        assertEq(payer.balance, payerBefore);
    }

    function test_doubleReleaseReverts() public {
        vm.prank(payer);
        uint256 escrowId = escrow.createEscrow{value: 0.5 ether}(
            payee,
            0.5 ether,
            address(0),
            UniversalPaymentEscrow.PaymentType.TOLL
        );

        vm.prank(payer);
        escrow.releaseEscrow(escrowId);

        vm.prank(payer);
        vm.expectRevert("UniversalPaymentEscrow: not pending");
        escrow.releaseEscrow(escrowId);
    }

    function test_unauthorizedReleaseReverts() public {
        vm.prank(payer);
        uint256 escrowId = escrow.createEscrow{value: 1 ether}(
            payee,
            1 ether,
            address(0),
            UniversalPaymentEscrow.PaymentType.V2G
        );

        vm.prank(payee); // payee should not be able to release
        vm.expectRevert("UniversalPaymentEscrow: unauthorized");
        escrow.releaseEscrow(escrowId);
    }

    function test_setFeeBps() public {
        escrow.setFeeBps(50);
        assertEq(escrow.feeBps(), 50);
    }

    function test_feeTooHighReverts() public {
        vm.expectRevert("UniversalPaymentEscrow: fee too high");
        escrow.setFeeBps(2000);
    }
}
