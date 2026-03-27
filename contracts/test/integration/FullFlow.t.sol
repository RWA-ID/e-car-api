// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../../src/core/VehicleIdentity.sol";
import "../../src/core/BatteryPassport.sol";
import "../../src/core/UniversalPaymentEscrow.sol";
import "../../src/core/AgentWallet.sol";
import "../../src/charging/ChargingStationRegistry.sol";
import "../../src/charging/ChargingPaymentRouter.sol";

/// @title FullFlow Integration Test
/// @notice Tests the complete e-car.eth protocol flow end-to-end
contract FullFlowTest is Test {
    VehicleIdentity public vehicleIdentity;
    BatteryPassport public batteryPassport;
    UniversalPaymentEscrow public paymentEscrow;
    AgentWallet public agentWallet;
    ChargingStationRegistry public stationRegistry;
    ChargingPaymentRouter public chargingRouter;

    address public admin = address(this);
    address public user = address(0xA11CE);
    address public stationOperator = address(0x5747);
    address public treasury = address(0x7EA5);
    address public oracle = address(0x0AC1);

    function setUp() public {
        // Deploy all contracts
        vehicleIdentity = new VehicleIdentity(admin);
        batteryPassport = new BatteryPassport(admin);
        paymentEscrow = new UniversalPaymentEscrow(treasury);
        stationRegistry = new ChargingStationRegistry();
        chargingRouter = new ChargingPaymentRouter(
            address(stationRegistry),
            address(paymentEscrow)
        );

        // Grant roles
        vehicleIdentity.grantRole(vehicleIdentity.REGISTRAR_ROLE(), admin);
        batteryPassport.grantRole(batteryPassport.ORACLE_ROLE(), oracle);

        // Transfer escrow ownership to router for releasing
        paymentEscrow.transferOwnership(address(chargingRouter));

        // Fund test accounts
        vm.deal(user, 50 ether);
        vm.deal(stationOperator, 5 ether);
    }

    function test_fullFlow_registerVehicle_updateBattery_initiateCharging_finalizeSession() public {
        // Step 1: Register vehicle
        bytes32 vinHash = keccak256("1HGBH41JXMN109186");
        uint256 tokenId = vehicleIdentity.registerVehicle(
            vinHash, "Tesla", "Model Y", 2024, 82
        );
        assertEq(tokenId, 1);
        assertEq(vehicleIdentity.ownerOf(tokenId), admin);
        assertTrue(vehicleIdentity.locked(tokenId));
        console.log("Step 1: Vehicle registered, tokenId =", tokenId);

        // Step 2: Update battery passport
        bytes32 batteryRoot = keccak256("battery-data-root");
        vm.prank(oracle);
        batteryPassport.updatePassport(tokenId, batteryRoot, 98, 15);
        assertEq(batteryPassport.getLatestRoot(tokenId), batteryRoot);
        console.log("Step 2: Battery passport updated, SoH = 98%");

        // Step 3: Deploy agent wallet for vehicle
        agentWallet = new AgentWallet(admin, tokenId);
        vm.deal(address(agentWallet), 10 ether);
        console.log("Step 3: Agent wallet deployed at", address(agentWallet));

        // Step 4: Register charging station
        vm.prank(stationOperator);
        bytes32 stationId = stationRegistry.registerStation("TSLA-LA-001", "tesla", 0.1 ether);
        console.log("Step 4: Charging station registered");

        // Step 5: Initiate charging session
        uint256 estimatedKwh = 30;
        uint256 estimatedCost = 3 ether; // 30 * 0.1 ETH

        vm.prank(user);
        uint256 sessionId = chargingRouter.initiateChargingSession{value: estimatedCost}(
            stationId,
            estimatedKwh,
            address(0)
        );
        console.log("Step 5: Charging session initiated, sessionId =", sessionId);

        // Step 6: Finalize charging session
        uint256 actualKwh = 28; // Less than estimated
        chargingRouter.finalizeSession(sessionId, actualKwh);

        (,, address sessionUser,,, bool finalized) = chargingRouter.sessions(sessionId);
        assertTrue(finalized);
        assertEq(sessionUser, user);
        console.log("Step 6: Charging session finalized, actual kWh =", actualKwh);

        console.log("Full flow completed successfully!");
    }

    function test_vehicleIsLockedAfterTransferRole() public {
        uint256 tokenId = vehicleIdentity.registerVehicle(
            keccak256("VIN2"), "Ford", "Mach-E", 2024, 98
        );

        assertTrue(vehicleIdentity.locked(tokenId));

        vehicleIdentity.grantRole(vehicleIdentity.TRANSFER_ROLE(), admin);
        vehicleIdentity.transferVehicle(tokenId, user);

        assertEq(vehicleIdentity.ownerOf(tokenId), user);
        assertTrue(vehicleIdentity.locked(tokenId)); // re-locked
    }
}
