// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../../src/core/BatteryPassport.sol";

contract BatteryPassportTest is Test {
    BatteryPassport public bp;
    address public admin = address(this);

    function setUp() public {
        bp = new BatteryPassport(admin);
    }

    function test_updatePassport() public {
        bytes32 root = keccak256("merkle-root-1");
        bp.updatePassport(1, root, 95, 100);

        bytes32 latestRoot = bp.getLatestRoot(1);
        assertEq(latestRoot, root);
    }

    function test_updatePassportMultipleTimes() public {
        bp.updatePassport(1, keccak256("root1"), 95, 50);
        bytes32 root2 = keccak256("root2");
        bp.updatePassport(1, root2, 90, 100);

        assertEq(bp.getLatestRoot(1), root2);
        assertEq(bp.getHistory(1).length, 2);
    }

    function test_getHistory() public {
        bp.updatePassport(2, keccak256("r1"), 97, 10);
        bp.updatePassport(2, keccak256("r2"), 94, 20);
        bp.updatePassport(2, keccak256("r3"), 91, 30);

        BatteryPassport.PassportEntry[] memory history = bp.getHistory(2);
        assertEq(history.length, 3);
        assertEq(history[0].stateOfHealth, 97);
        assertEq(history[2].stateOfHealth, 91);
    }

    function test_verifyEntry() public {
        // Build a simple 2-leaf merkle tree
        bytes32 leaf1 = keccak256(abi.encodePacked("data1"));
        bytes32 leaf2 = keccak256(abi.encodePacked("data2"));

        // Sort leaves
        bytes32 a = leaf1 < leaf2 ? leaf1 : leaf2;
        bytes32 b = leaf1 < leaf2 ? leaf2 : leaf1;
        bytes32 root = keccak256(abi.encodePacked(a, b));

        bp.updatePassport(3, root, 88, 200);

        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leaf2;

        assertTrue(bp.verifyEntry(3, proof, leaf1));
    }

    function test_noEntryReverts() public {
        vm.expectRevert("BatteryPassport: no entries");
        bp.getLatestRoot(999);
    }

    function test_onlyOracleCanUpdate() public {
        vm.prank(address(0xDEAD));
        vm.expectRevert();
        bp.updatePassport(1, keccak256("root"), 90, 50);
    }
}
