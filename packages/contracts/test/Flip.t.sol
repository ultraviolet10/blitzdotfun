// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import { Test, console2 } from "forge-std/Test.sol";
import { Flip } from "../src/Flip.sol";
import { MockERC20 } from "../src/mocks/MockERC20.sol";

contract FlipTest is Test {
    Flip public flip;
    address public mockToken;
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function setUp() public {
        flip = new Flip();
        mockToken = address(new MockERC20("MockTokenA", "MTA", uint8(18)));

        MockERC20(mockToken).mint(alice, 1000);
    }
    
    function test_AliceSendsFlipTokenAndThenFlipCanJustSendItWithoutAnyApproval() public {
        // Impersonate Alice for the duration of these calls
        vm.startPrank(alice);
        // Alice directly transfers tokens to the Flip contract
        MockERC20(mockToken).transfer(address(flip), 10);
        // Stop impersonating Alice
        vm.stopPrank();
        // Verify the balance
        assertEq(MockERC20(mockToken).balanceOf(address(flip)), 10);

        // send the tokens to bob without any approval, which was obvious in hindsight
        vm.startPrank(address(flip));
        MockERC20(mockToken).transfer(bob, 5);
        assertEq(MockERC20(mockToken).balanceOf(address(bob)), 5);
        vm.stopPrank();
    }
}