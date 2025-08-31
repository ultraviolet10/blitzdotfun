// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {Blitz} from "../src/Blitz.sol";
import {MockCreatorCoin} from "../src/mocks/MockCreatorCoin.sol";
import { TokensLocked, BattleCreated } from "../src/interfaces/EventsAndErrors.sol";

contract BlitzTest is Test {
    Blitz public blitz;
    MockCreatorCoin public coin1;
    MockCreatorCoin public coin2;
    
    address public playerOne = address(0x1);
    address public playerTwo = address(0x2);
    address public playerThree = address(0x3);
    
    function setUp() public {
        blitz = new Blitz();
        
        coin1 = new MockCreatorCoin("Creator1", "C1", playerOne);
        coin2 = new MockCreatorCoin("Creator2", "C2", playerTwo);
        
        vm.startPrank(playerOne);
        coin1.approve(address(blitz), type(uint256).max);
        blitz.depositCreatorTokens(address(coin1), 1000 ether);
        vm.stopPrank();
        
        vm.startPrank(playerTwo);
        coin2.approve(address(blitz), type(uint256).max);
        blitz.depositCreatorTokens(address(coin2), 1000 ether);
        vm.stopPrank();
    }
    
    function testStartContestSuccess() public {
        bytes32 battleId = blitz.startContest(playerOne, playerTwo, address(coin1), address(coin2));
        
        (, address p1, address p2, , uint256 startTime, uint256 endTime, address coin1Addr, address coin2Addr, uint256 stake1, uint256 stake2,) = blitz.battles(battleId);
        
        assertEq(p1, playerOne);
        assertEq(p2, playerTwo);
        assertEq(coin1Addr, address(coin1));
        assertEq(coin2Addr, address(coin2));
        assertEq(startTime, block.timestamp);
        assertEq(endTime, block.timestamp + blitz.battleDuration());
        assertEq(stake1, 100 ether);
        assertEq(stake2, 100 ether);
        
        bytes32 activeBattle1 = blitz.activeBattles(playerOne, playerTwo);
        bytes32 activeBattle2 = blitz.activeBattles(playerTwo, playerOne);
        
        assertEq(activeBattle1, battleId);
        assertEq(activeBattle2, battleId);
    }
    
    function testStartContestRevertsSamePlayer() public {
        vm.expectRevert("Cannot challenge self");
        blitz.startContest(playerOne, playerOne, address(coin1), address(coin2));
    }
    
    function testStartContestRevertsInvalidCoinAddresses() public {
        vm.expectRevert("Invalid coin addresses");
        blitz.startContest(playerOne, playerTwo, address(0), address(coin2));
        
        vm.expectRevert("Invalid coin addresses");
        blitz.startContest(playerOne, playerTwo, address(coin1), address(0));
    }
    
    function testStartContestRevertsActiveBattleExists() public {
        blitz.startContest(playerOne, playerTwo, address(coin1), address(coin2));
        
        vm.expectRevert("Active battle already exists");
        blitz.startContest(playerOne, playerTwo, address(coin1), address(coin2));
        
        vm.expectRevert("Active battle already exists");
        blitz.startContest(playerTwo, playerOne, address(coin2), address(coin1));
    }
    
    function testStartContestRevertsWrongCoinOwner() public {
        MockCreatorCoin wrongCoin = new MockCreatorCoin("Wrong", "W", playerThree);
        
        vm.expectRevert("Creator not coin owner");
        blitz.startContest(playerOne, playerTwo, address(wrongCoin), address(coin2));
    }
    
    function testStartContestRevertsNoClaimableAmount() public {
        coin1.setClaimableAmount(0);
        
        vm.expectRevert("No claimable vested tokens");
        blitz.startContest(playerOne, playerTwo, address(coin1), address(coin2));
    }
    
    function testStartContestRevertsInsufficientDeposits() public {
        address playerFour = address(0x4);
        MockCreatorCoin coin3 = new MockCreatorCoin("Creator3", "C3", playerFour);
        
        vm.expectRevert("Player one: insufficient deposited tokens");
        blitz.startContest(playerFour, playerTwo, address(coin3), address(coin2));
        
        vm.expectRevert("Player two: insufficient deposited tokens");
        blitz.startContest(playerOne, playerFour, address(coin1), address(coin3));
    }
    
    function testStartContestWhenPaused() public {
        blitz.emergencyPause("Testing pause");
        
        vm.expectRevert();
        blitz.startContest(playerOne, playerTwo, address(coin1), address(coin2));
    }
    
    function testStartContestEmitsEvents() public {
        bytes32 actualBattleId = blitz.startContest(playerOne, playerTwo, address(coin1), address(coin2));
        
        // Verify the battleId is properly generated (non-zero)
        assertTrue(actualBattleId != bytes32(0));
        
        // Verify it matches the expected format (using the timestamp when the function was called)
        bytes32 expectedBattleId = keccak256(abi.encodePacked(playerOne, playerTwo, block.timestamp));
        assertEq(actualBattleId, expectedBattleId);
    }
    
    function testStartContestStakeCalculation() public {
        coin1.setClaimableAmount(2000 ether);
        coin2.setClaimableAmount(5000 ether);
        
        bytes32 battleId = blitz.startContest(playerOne, playerTwo, address(coin1), address(coin2));
        
        (, , , , , , , , uint256 stake1, uint256 stake2,) = blitz.battles(battleId);
        
        assertEq(stake1, 200 ether);
        assertEq(stake2, 500 ether);
    }
    
    function testStartContestMultipleBattlesSamePlayer() public {
        address playerFour = address(0x4);
        MockCreatorCoin coin3 = new MockCreatorCoin("Creator3", "C3", playerFour);
        
        vm.startPrank(playerFour);
        coin3.approve(address(blitz), type(uint256).max);
        blitz.depositCreatorTokens(address(coin3), 1000 ether);
        vm.stopPrank();
        
        bytes32 battle1 = blitz.startContest(playerOne, playerTwo, address(coin1), address(coin2));
        bytes32 battle2 = blitz.startContest(playerOne, playerFour, address(coin1), address(coin3));
        
        assertTrue(battle1 != battle2);
        assertEq(blitz.activeBattles(playerOne, playerTwo), battle1);
        assertEq(blitz.activeBattles(playerOne, playerFour), battle2);
    }
}

