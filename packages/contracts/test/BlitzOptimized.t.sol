// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {ICreatorCoin} from "../src/interfaces/ICreatorCoin.sol";
import {Blitz} from "../src/Blitz.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {BattleState, Battle} from "../src/interfaces/Types.sol";
import {
    BattleCreated,
    BattleCompleted
} from "../src/interfaces/EventsAndErrors.sol";

/// @title Comprehensive tests for optimized Blitz endContest function
/// @notice Tests timing validation, token escrow security, and gas optimization
contract BlitzOptimizedTest is Test {
    Blitz public blitz;
    MockCreatorCoin public coinA;
    MockCreatorCoin public coinB;
    
    address public admin = address(0x1);
    address public playerOne = address(0x2);
    address public playerTwo = address(0x3);
    address public collector1 = address(0x4);
    address public collector2 = address(0x5);
    address public collector3 = address(0x6);
    
    uint256 public constant STAKE_AMOUNT = 1000 * 10**18; // 1000 tokens
    uint256 public constant BATTLE_DURATION = 12 hours;

    function setUp() public {
        // Deploy contracts
        vm.startPrank(admin);
        blitz = new Blitz();
        vm.stopPrank();

        // Create mock creator coins with large supply
        coinA = new MockCreatorCoin("Creator A Coin", "CAINA", playerOne, STAKE_AMOUNT);
        coinB = new MockCreatorCoin("Creator B Coin", "COINB", playerTwo, STAKE_AMOUNT);
        
        // Transfer tokens to contract for staking (coins are created with large supply in their own address)
        vm.startPrank(address(coinA));
        coinA.transfer(address(blitz), STAKE_AMOUNT);
        vm.stopPrank();
        
        vm.startPrank(address(coinB));
        coinB.transfer(address(blitz), STAKE_AMOUNT);
        vm.stopPrank();
        
        // Setup collector balances for distribution testing
        vm.startPrank(address(coinA));
        coinA.transfer(collector1, 1000 * 10**18);
        coinA.transfer(collector2, 500 * 10**18);  
        coinA.transfer(collector3, 250 * 10**18);
        vm.stopPrank();
    }

    /// @notice Test basic contest creation and immediate ending
    function testBasicContestFlow() public {
        // Create contest
        vm.prank(admin);
        bytes32 battleId = blitz.startContest(playerOne, playerTwo, address(coinA), address(coinB));
        
        // Verify battle was created
        Battle memory battle = blitz.getBattleSummary(battleId);
        assertEq(battle.playerOne, playerOne);
        assertEq(battle.playerTwo, playerTwo);
        assertEq(uint8(battle.state), uint8(BattleState.CHALLENGE_PERIOD));
        assertGt(battle.endTime, block.timestamp);

        // Fast forward past battle duration
        vm.warp(block.timestamp + BATTLE_DURATION + 1);
        
        // Prepare collector data (backend-computed)
        address[] memory collectors = new address[](2);
        collectors[0] = collector1;
        collectors[1] = collector2;
        
        // Prize pool is the loser's stake = 100 tokens. 20% total goes to collectors.
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 15 * 10**18; // 15% of 100 token prize pool = 15 tokens
        amounts[1] = 5 * 10**18;  // 5% of 100 token prize pool = 5 tokens
        
        // Record gas usage
        uint256 gasStart = gasleft();
        
        // End contest with playerOne as winner
        vm.prank(admin);
        blitz.endContest(battleId, playerOne, collectors, amounts);
        
        uint256 gasUsed = gasStart - gasleft();
        console.log("Gas used for endContest:", gasUsed);
        
        // Verify battle completion
        battle = blitz.getBattleSummary(battleId);
        assertEq(battle.winner, playerOne);
        assertEq(uint8(battle.state), uint8(BattleState.COMPLETED));
        
        // The actual stake is 10% of claimable amount (100 tokens, not 1000)
        uint256 actualStake = 100 * 10**18;
        
        // Verify winner received their stake + 50% of prize pool
        assertEq(coinA.balanceOf(playerOne), actualStake); // Own stake back
        assertEq(coinB.balanceOf(playerOne), 50 * 10**18); // 50% of loser's stake (50 tokens)
        
        // Verify collectors received their allocations (total should be 20% of prize pool = 20 tokens)
        assertEq(coinB.balanceOf(collector1), 15 * 10**18); // 15 tokens as specified
        assertEq(coinB.balanceOf(collector2), 5 * 10**18);  // 5 tokens as specified
    }

    /// @notice Test timing validation - cannot end contest before endTime
    function testCannotEndContestEarly() public {
        // Create contest
        vm.prank(admin);
        bytes32 battleId = blitz.startContest(playerOne, playerTwo, address(coinA), address(coinB));
        
        // Try to end contest immediately (should fail)
        address[] memory collectors = new address[](0);
        uint256[] memory amounts = new uint256[](0);
        
        vm.prank(admin);
        vm.expectRevert("Contest still ongoing");
        blitz.endContest(battleId, playerOne, collectors, amounts);
        
        // Try again 1 second before end time (should still fail)
        vm.warp(block.timestamp + BATTLE_DURATION - 1);
        
        vm.prank(admin);
        vm.expectRevert("Contest still ongoing");
        blitz.endContest(battleId, playerOne, collectors, amounts);
        
        // Should work after end time (timestamp > endTime)
        vm.warp(block.timestamp + 2); // Move past the end time
        
        vm.prank(admin);
        blitz.endContest(battleId, playerOne, collectors, amounts);
        
        Battle memory battle = blitz.getBattleSummary(battleId);
        assertEq(uint8(battle.state), uint8(BattleState.COMPLETED));
    }

    /// @notice Test token escrow security - tokens are locked during battle
    function testTokenEscrowSecurity() public {
        uint256 initialContractBalanceA = coinA.balanceOf(address(blitz));
        uint256 initialContractBalanceB = coinB.balanceOf(address(blitz));
        
        // Create contest (tokens should be locked in contract)
        vm.prank(admin);
        bytes32 battleId = blitz.startContest(playerOne, playerTwo, address(coinA), address(coinB));
        
        // Verify tokens are still in contract (escrow)
        assertEq(coinA.balanceOf(address(blitz)), initialContractBalanceA);
        assertEq(coinB.balanceOf(address(blitz)), initialContractBalanceB);
        
        // Verify players don't have access to staked tokens
        assertEq(coinA.balanceOf(playerOne), 0); // Used their tokens for stake
        assertEq(coinB.balanceOf(playerTwo), 0); // Used their tokens for stake
        
        // Fast forward and end contest
        vm.warp(block.timestamp + BATTLE_DURATION + 1);
        
        address[] memory collectors = new address[](1);
        collectors[0] = collector1;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 20 * 10**18; // 20% of 100 token prize pool = 20 tokens
        
        vm.prank(admin);
        blitz.endContest(battleId, playerOne, collectors, amounts);
        
        // The actual stake is 100 tokens (10% of 1000 claimable)
        uint256 actualStake = 100 * 10**18;
        
        // Verify tokens are distributed correctly
        assertEq(coinA.balanceOf(playerOne), actualStake); // Winner gets own stake back
        assertEq(coinB.balanceOf(playerOne), 50 * 10**18); // 50% of loser's stake (50 tokens)
        assertEq(coinB.balanceOf(collector1), 20 * 10**18); // 20 tokens as specified
        
        // Verify contract retains treasury portion (10% of 100 token stake = 10 tokens)
        assertEq(blitz.getTreasuryBalance(address(coinB)), 10 * 10**18);
    }

    /// @notice Test backend-computed winner validation
    function testWinnerValidation() public {
        vm.prank(admin);
        bytes32 battleId = blitz.startContest(playerOne, playerTwo, address(coinA), address(coinB));
        
        vm.warp(block.timestamp + BATTLE_DURATION + 1);
        
        address[] memory collectors = new address[](0);
        uint256[] memory amounts = new uint256[](0);
        
        // Invalid winner (not a participant)
        vm.prank(admin);
        vm.expectRevert("Invalid winner address");
        blitz.endContest(battleId, collector1, collectors, amounts);
        
        // Valid winners should work
        vm.prank(admin);
        blitz.endContest(battleId, playerOne, collectors, amounts);
        
        Battle memory battle = blitz.getBattleSummary(battleId);
        assertEq(battle.winner, playerOne);
    }

    /// @notice Test collector array validation
    function testCollectorArrayValidation() public {
        vm.prank(admin);
        bytes32 battleId = blitz.startContest(playerOne, playerTwo, address(coinA), address(coinB));
        
        vm.warp(block.timestamp + BATTLE_DURATION + 1);
        
        // Mismatched array lengths should fail
        address[] memory collectors = new address[](2);
        collectors[0] = collector1;
        collectors[1] = collector2;
        
        uint256[] memory amounts = new uint256[](1); // Wrong length
        amounts[0] = 100 * 10**18;
        
        vm.prank(admin);
        vm.expectRevert("Array length mismatch");
        blitz.endContest(battleId, playerOne, collectors, amounts);
        
        // Matching arrays should work
        uint256[] memory correctAmounts = new uint256[](2);
        correctAmounts[0] = 100 * 10**18;
        correctAmounts[1] = 50 * 10**18;
        
        vm.prank(admin);
        blitz.endContest(battleId, playerOne, collectors, correctAmounts);
    }

    /// @notice Test gas consumption benchmarking
    function testGasOptimization() public {
        // Test with different collector array sizes
        uint256[] memory collectorSizes = new uint256[](4);
        collectorSizes[0] = 0;  // No collectors
        collectorSizes[1] = 1;  // Single collector
        collectorSizes[2] = 10; // Medium array
        collectorSizes[3] = 50; // Large array
        
        // Create different player pairs for each test to avoid active battle conflicts
        address[4] memory testPlayersOne = [playerOne, collector1, collector2, collector3];
        address[4] memory testPlayersTwo = [playerTwo, address(0x10), address(0x11), address(0x12)];
        
        for (uint i = 0; i < collectorSizes.length; i++) {
            // Create mock coins for this test
            MockCreatorCoin testCoinA = new MockCreatorCoin("Test A", "TTA", testPlayersOne[i], STAKE_AMOUNT);
            MockCreatorCoin testCoinB = new MockCreatorCoin("Test B", "TTB", testPlayersTwo[i], STAKE_AMOUNT);
            
            // Transfer tokens to contract for staking
            vm.startPrank(address(testCoinA));
            testCoinA.transfer(address(blitz), STAKE_AMOUNT);
            vm.stopPrank();
            
            vm.startPrank(address(testCoinB));
            testCoinB.transfer(address(blitz), STAKE_AMOUNT);  
            vm.stopPrank();
            
            // Create contest with unique players
            vm.prank(admin);
            bytes32 battleId = blitz.startContest(testPlayersOne[i], testPlayersTwo[i], address(testCoinA), address(testCoinB));
            
            // Fast forward past battle duration
            vm.warp(block.timestamp + BATTLE_DURATION + 1);
            
            // Prepare collector arrays
            address[] memory collectors = new address[](collectorSizes[i]);
            uint256[] memory amounts = new uint256[](collectorSizes[i]);
            
            for (uint j = 0; j < collectorSizes[i]; j++) {
                collectors[j] = address(uint160(1000 + j)); // Generate unique addresses
                amounts[j] = 1 * 10**18; // 1 token each
            }
            
            // Measure gas
            uint256 gasStart = gasleft();
            vm.prank(admin);
            blitz.endContest(battleId, testPlayersOne[i], collectors, amounts);
            uint256 gasUsed = gasStart - gasleft();
            
            console.log("Gas used with", collectorSizes[i], "collectors:", gasUsed);
            
            // Gas should scale reasonably with collector count
            // Expected: ~105K base + ~25K per collector
            uint256 expectedMaxGas = 105000 + (collectorSizes[i] * 30000);
            assertLt(gasUsed, expectedMaxGas, "Gas scaling too high");
            
            // Reset for next iteration - wait past the battle duration
            vm.warp(block.timestamp + 2 days);
        }
    }

    /// @notice Test battle state transitions and access control
    function testBattleStateAndAccess() public {
        vm.prank(admin);
        bytes32 battleId = blitz.startContest(playerOne, playerTwo, address(coinA), address(coinB));
        
        Battle memory battle = blitz.getBattleSummary(battleId);
        assertEq(uint8(battle.state), uint8(BattleState.CHALLENGE_PERIOD));
        
        // Non-admin cannot end contest
        vm.warp(block.timestamp + BATTLE_DURATION + 1);
        address[] memory collectors = new address[](0);
        uint256[] memory amounts = new uint256[](0);
        
        vm.prank(playerOne);
        vm.expectRevert();
        blitz.endContest(battleId, playerOne, collectors, amounts);
        
        // Admin can end contest
        vm.prank(admin);
        blitz.endContest(battleId, playerOne, collectors, amounts);
        
        battle = blitz.getBattleSummary(battleId);
        assertEq(uint8(battle.state), uint8(BattleState.COMPLETED));
        
        // Cannot end already completed contest
        vm.prank(admin);
        vm.expectRevert("Battle not in active state");
        blitz.endContest(battleId, playerTwo, collectors, amounts);
    }

    /// @notice Test treasury accumulation
    function testTreasuryAccumulation() public {
        vm.prank(admin);
        bytes32 battleId = blitz.startContest(playerOne, playerTwo, address(coinA), address(coinB));
        
        vm.warp(block.timestamp + BATTLE_DURATION + 1);
        
        uint256 initialTreasuryBalance = blitz.getTreasuryBalance(address(coinB));
        
        address[] memory collectors = new address[](0);
        uint256[] memory amounts = new uint256[](0);
        
        vm.prank(admin);
        blitz.endContest(battleId, playerOne, collectors, amounts);
        
        // Treasury should receive 10% of prize pool (10 tokens from 100 stake)
        uint256 finalTreasuryBalance = blitz.getTreasuryBalance(address(coinB));
        assertEq(finalTreasuryBalance - initialTreasuryBalance, 10 * 10**18);
    }

    /// @notice Test events emission
    function testEventEmission() public {
        vm.prank(admin);
        bytes32 battleId = blitz.startContest(playerOne, playerTwo, address(coinA), address(coinB));
        
        vm.warp(block.timestamp + BATTLE_DURATION + 1);
        
        address[] memory collectors = new address[](0);
        uint256[] memory amounts = new uint256[](0);
        
        // Expect BattleCompleted event
        vm.expectEmit(true, true, false, true);
        emit BattleCompleted(battleId, playerOne);
        
        vm.prank(admin);
        blitz.endContest(battleId, playerOne, collectors, amounts);
    }
}

/// @notice Mock CreatorCoin for testing
contract MockCreatorCoin is ERC20 {
    address public payoutRecipient;
    uint256 private claimableAmount;
    
    constructor(
        string memory name,
        string memory symbol,
        address _payoutRecipient,
        uint256 _claimableAmount
    ) ERC20(name, symbol) {
        payoutRecipient = _payoutRecipient;
        claimableAmount = _claimableAmount;
        _mint(address(this), 10000000 * 10**18); // Large supply for testing
    }
    
    function getClaimableAmount() external view returns (uint256) {
        return claimableAmount;
    }
    
    function setClaimableAmount(uint256 _amount) external {
        claimableAmount = _amount;
    }
    
    function transfer(address to, uint256 amount) public override returns (bool) {
        return super.transfer(to, amount);
    }
}