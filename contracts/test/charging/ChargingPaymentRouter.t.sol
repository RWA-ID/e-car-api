// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../../src/charging/ChargingStationRegistry.sol";
import "../../src/charging/ChargingPaymentRouter.sol";
import "../../src/core/UniversalPaymentEscrow.sol";

contract ChargingPaymentRouterTest is Test {
    ChargingStationRegistry public registry;
    UniversalPaymentEscrow public escrow;
    ChargingPaymentRouter public router;

    address public admin = address(this);
    address public operator = address(0x0E37);
    address public user = address(0xA5E7);
    address public treasury = address(0x7EA5);

    function setUp() public {
        registry = new ChargingStationRegistry();
        escrow = new UniversalPaymentEscrow(treasury);
        router = new ChargingPaymentRouter(address(registry), address(escrow));

        vm.deal(user, 10 ether);

        // Transfer ownership of escrow to router so it can release escrows
        escrow.transferOwnership(address(router));
    }

    function test_initiateAndFinalizeSession() public {
        // Register a station
        vm.prank(operator);
        bytes32 stationId = registry.registerStation("STATION_001", "tesla", 1 ether); // 1 ETH per kWh

        uint256 estimatedKwh = 2;
        uint256 estimatedCost = 2 ether;

        // Allow router to create escrows
        vm.prank(user);
        uint256 sessionId = router.initiateChargingSession{value: estimatedCost}(
            stationId,
            estimatedKwh,
            address(0)
        );

        assertEq(sessionId, 1);

        // Oracle (admin = owner of router) finalizes
        router.finalizeSession(sessionId, estimatedKwh);

        (,, address sessionUser, uint256 estKwh, uint256 actKwh, bool finalized) =
            router.sessions(sessionId);
        assertEq(sessionUser, user);
        assertEq(estKwh, estimatedKwh);
        assertEq(actKwh, estimatedKwh);
        assertTrue(finalized);
    }

    function test_getSessionCost() public {
        vm.prank(operator);
        bytes32 stationId = registry.registerStation("STATION_002", "ford", 0.5 ether);

        uint256 cost = router.getSessionCost(stationId, 10);
        assertEq(cost, 5 ether);
    }

    function test_inactiveStationReverts() public {
        vm.prank(operator);
        bytes32 stationId = registry.registerStation("STATION_003", "rivian", 1 ether);
        registry.deactivateStation(stationId);

        vm.prank(user);
        vm.expectRevert("ChargingPaymentRouter: station not active");
        router.initiateChargingSession{value: 2 ether}(stationId, 2, address(0));
    }
}
