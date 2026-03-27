// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../../src/core/VehicleIdentity.sol";

contract VehicleIdentityTest is Test {
    VehicleIdentity public vi;
    address public admin = address(this);
    address public alice = address(0xA11CE);
    address public bob = address(0xB0B);

    function setUp() public {
        vi = new VehicleIdentity(admin);
    }

    function test_registerVehicle() public {
        bytes32 vinHash = keccak256("VIN1234567890");
        uint256 tokenId = vi.registerVehicle(vinHash, "Tesla", "Model 3", 2024, 75);

        assertEq(tokenId, 1);
        assertEq(vi.ownerOf(tokenId), admin);

        VehicleIdentity.VehicleData memory data = vi.getVehicle(tokenId);
        assertEq(data.vinHash, vinHash);
        assertEq(data.manufacturer, "Tesla");
        assertEq(data.model, "Model 3");
        assertEq(data.year, 2024);
        assertEq(data.batteryCapacityKwh, 75);
        assertFalse(data.transferApproved);
    }

    function test_lockedByDefault() public {
        bytes32 vinHash = keccak256("VIN_LOCK_TEST");
        uint256 tokenId = vi.registerVehicle(vinHash, "Rivian", "R1T", 2024, 135);
        assertTrue(vi.locked(tokenId));
    }

    function test_transferRequiresRole() public {
        bytes32 vinHash = keccak256("VIN_TRANSFER_TEST");
        uint256 tokenId = vi.registerVehicle(vinHash, "Ford", "Mach-E", 2023, 98);

        vm.prank(alice);
        vm.expectRevert();
        vi.transferFrom(admin, alice, tokenId);
    }

    function test_transferWithRole() public {
        bytes32 vinHash = keccak256("VIN_ROLE_TEST");
        uint256 tokenId = vi.registerVehicle(vinHash, "BMW", "iX", 2024, 111);

        vi.grantRole(vi.TRANSFER_ROLE(), admin);
        vi.transferVehicle(tokenId, alice);

        assertEq(vi.ownerOf(tokenId), alice);
        assertTrue(vi.locked(tokenId)); // re-locked after transfer
    }

    function test_supportsERC5192() public view {
        assertTrue(vi.supportsInterface(0xb45a3c0e));
    }

    function test_multipleRegistrations() public {
        vi.registerVehicle(keccak256("V1"), "Tesla", "S", 2022, 100);
        vi.registerVehicle(keccak256("V2"), "Audi", "e-tron", 2023, 95);
        uint256 third = vi.registerVehicle(keccak256("V3"), "Porsche", "Taycan", 2024, 93);
        assertEq(third, 3);
    }

    function test_unauthorizedRegistrarReverts() public {
        vm.prank(bob);
        vm.expectRevert();
        vi.registerVehicle(keccak256("UNAUTH"), "Fake", "Car", 2020, 50);
    }
}
