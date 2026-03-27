// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../../src/namespace/BrandRegistry.sol";

contract BrandRegistryTest is Test {
    BrandRegistry public registry;
    address public brand_ = address(this);

    function setUp() public {
        registry = new BrandRegistry(brand_, "tesla");
    }

    function test_setAndGetRecord() public {
        bytes32 node = keccak256(abi.encodePacked(bytes32(0), keccak256(bytes("tesla"))));

        address resolver_ = address(0xDEF);
        uint64 ttl_ = 3600;

        registry.setRecord(node, brand_, resolver_, ttl_);

        assertEq(registry.owner(node), brand_);
        assertEq(registry.resolver(node), resolver_);
        assertEq(registry.ttl(node), ttl_);
    }

    function test_setOwner() public {
        bytes32 node = keccak256(abi.encodePacked(bytes32(0), keccak256(bytes("tesla"))));
        address newOwner = address(0xABCD);

        registry.setOwner(node, newOwner);
        assertEq(registry.owner(node), newOwner);
    }

    function test_unauthorizedSetReverts() public {
        bytes32 node = keccak256(abi.encodePacked(bytes32(0), keccak256(bytes("tesla"))));
        bytes32 childNode = keccak256(abi.encodePacked(node, keccak256(bytes("model3"))));

        vm.prank(address(0xBAD));
        vm.expectRevert("BrandRegistry: not node owner");
        registry.setOwner(childNode, address(0xBAD));
    }

    function test_brandName() public view {
        assertEq(registry.brandName(), "tesla");
        assertEq(registry.brand(), brand_);
    }

    function test_recordExists() public view {
        bytes32 node = keccak256(abi.encodePacked(bytes32(0), keccak256(bytes("tesla"))));
        assertTrue(registry.recordExists(node));

        bytes32 nonExistent = keccak256("nonexistent");
        assertFalse(registry.recordExists(nonExistent));
    }
}
