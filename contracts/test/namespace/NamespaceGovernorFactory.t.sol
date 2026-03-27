// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../../src/namespace/NamespaceGovernorFactory.sol";

contract NamespaceGovernorFactoryTest is Test {
    receive() external payable {}
    NamespaceGovernorFactory public factory;
    address public owner_ = address(this);
    address public claimer = address(0xC1A1);

    function setUp() public {
        factory = new NamespaceGovernorFactory();
        vm.deal(claimer, 100 ether);
    }

    function test_reservedBrands() public view {
        assertTrue(factory.isReserved("tesla"));
        assertTrue(factory.isReserved("ford"));
        assertTrue(factory.isReserved("bmw"));
        assertTrue(factory.isReserved("rivian"));
        assertFalse(factory.isReserved("myunknownbrand"));
    }

    function test_claimBrand() public {
        address[] memory signers = new address[](2);
        signers[0] = address(0x111);
        signers[1] = address(0x222);

        vm.prank(claimer);
        factory.claimBrand{value: 10 ether}("acme", signers);

        NamespaceGovernorFactory.BrandInfo memory info = factory.getBrandInfo("acme");
        assertTrue(info.claimed);
        assertEq(info.claimedBy, claimer);
        assertNotEq(info.registry, address(0));
        assertNotEq(info.resolver, address(0));
        assertNotEq(info.multiSig, address(0));
    }

    function test_claimBrandWrongFeeReverts() public {
        address[] memory signers = new address[](2);
        signers[0] = address(0x111);
        signers[1] = address(0x222);

        vm.prank(claimer);
        vm.expectRevert("NamespaceGovernorFactory: wrong fee");
        factory.claimBrand{value: 5 ether}("newbrand", signers);
    }

    function test_doubleClaimReverts() public {
        address[] memory signers = new address[](2);
        signers[0] = address(0x111);
        signers[1] = address(0x222);

        vm.prank(claimer);
        factory.claimBrand{value: 10 ether}("uniquebrand", signers);

        vm.prank(claimer);
        vm.expectRevert("NamespaceGovernorFactory: already claimed");
        factory.claimBrand{value: 10 ether}("uniquebrand", signers);
    }

    function test_reserveBrand() public {
        factory.reserveBrand("newreserved");
        assertTrue(factory.isReserved("newreserved"));
    }

    function test_getReservedBrands() public view {
        string[] memory reserved = factory.getReservedBrands();
        assertGt(reserved.length, 0);
    }
}
