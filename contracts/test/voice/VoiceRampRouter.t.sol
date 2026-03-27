// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../../src/voice/VoiceRampRouter.sol";

contract VoiceRampRouterTest is Test {
    VoiceRampRouter public router;
    address public owner_ = address(this);
    address public moonpay = address(0x000000000000000000000000000000000000000A);
    address public unauthorized = address(0xBAD);

    function setUp() public {
        router = new VoiceRampRouter();
    }

    function test_registerProvider() public {
        router.registerRampProvider("moonpay", moonpay);
        assertEq(router.getRampProvider("moonpay"), moonpay);
    }

    function test_registerProviderUnauthorizedReverts() public {
        vm.prank(unauthorized);
        vm.expectRevert();
        router.registerRampProvider("moonpay", moonpay);
    }

    function test_deactivateProvider() public {
        router.registerRampProvider("transak", address(0x1));
        router.deactivateRampProvider("transak");

        vm.expectRevert("VoiceRampRouter: provider not active");
        router.getRampProvider("transak");
    }

    function test_processIntent() public {
        bytes memory payload = abi.encode("stationId", 50);
        bytes memory result = router.processIntent("PAY_FOR_CHARGING", payload);

        // Unhandled intent returns encoded data
        (string memory intent, string memory status) = abi.decode(result, (string, string));
        assertEq(intent, "PAY_FOR_CHARGING");
        assertEq(status, "unhandled");
    }

    function test_registerIntentHandler() public {
        address handler = address(0xDEAD);
        router.registerIntentHandler("CHECK_BATTERY", handler);

        bytes32 intentHash = keccak256(bytes("CHECK_BATTERY"));
        assertEq(router.intentHandlers(intentHash), handler);
    }

    function test_getProviderNames() public {
        router.registerRampProvider("moonpay", moonpay);
        router.registerRampProvider("ramp", address(0x2));

        string[] memory names = router.getProviderNames();
        assertEq(names.length, 2);
    }
}
