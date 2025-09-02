// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {ICreatorCoin} from "../src/interfaces/ICreatorCoin.sol";
import {Blitz} from "../src/Blitz.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {BattleState, Battle} from "../src/interfaces/Types.sol";
import {
    BattleCreated,
    TokensLocked,
    BattleCompleted
} from "../src/interfaces/EventsAndErrors.sol";

// Mock CreatorCoin for testing that implements ICreatorCoin
contract MockCreatorCoin is ERC20 {
    address public payoutRecipient;
    IPoolManager public poolManager;
    uint256 public vestingStartTime;
    uint256 public vestingEndTime;
    uint256 public totalClaimed;
    
    uint256 private claimableAmount;
    
    event CreatorVestingClaimed(
        address indexed recipient,
        uint256 amount,
        uint256 totalClaimed,
        uint256 vestingStartTime,
        uint256 vestingEndTime
    );
    
    constructor(
        string memory name,
        string memory symbol,
        address _payoutRecipient,
        uint256 _claimableAmount
    ) ERC20(name, symbol) {
        payoutRecipient = _payoutRecipient;
        vestingStartTime = block.timestamp;
        vestingEndTime = block.timestamp + 365 days;
        claimableAmount = _claimableAmount;
        
        // Mint initial supply
        _mint(address(this), 1000000 * 10**18);
    }
    
    function getClaimableAmount() external view returns (uint256) {
        return claimableAmount;
    }
    
    function claimVesting() external returns (uint256) {
        uint256 amount = claimableAmount;
        claimableAmount = 0;
        totalClaimed += amount;
        _transfer(address(this), payoutRecipient, amount);
        
        emit CreatorVestingClaimed(
            payoutRecipient,
            amount,
            totalClaimed,
            vestingStartTime,
            vestingEndTime
        );
        
        return amount;
    }
    
    function setClaimableAmount(uint256 _amount) external {
        claimableAmount = _amount;
    }
}

contract BlitzTest is Test {
    Blitz public blitz;

    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address depositor = makeAddr("depositor");

    MockCreatorCoin aliceCoin;
    MockCreatorCoin bobCoin;

    function setUp() public {
        blitz = new Blitz();
        
        // Deploy mock creator coins for Alice and Bob
        _deployCreatorCoin(alice);
        _deployCreatorCoin(bob);
    }

    function _deployCreatorCoin(address creator) internal {
        string memory name = string(abi.encodePacked("Creator ", vm.toString(creator)));
        string memory symbol = string(abi.encodePacked("CR", vm.toString(creator)));
        
        // Deploy with 100,000 tokens as claimable amount
        uint256 claimableAmount = 100000 * 10**18;
        
        MockCreatorCoin coin = new MockCreatorCoin(name, symbol, creator, claimableAmount);
        
        // Store the coins for later use
        if (creator == alice) {
            aliceCoin = coin;
        } else if (creator == bob) {
            bobCoin = coin;
        }
    }

    function testDeployCreatorCoinFlow() public {
        // Test that our mock coins are deployed correctly
        assertEq(aliceCoin.payoutRecipient(), alice);
        assertEq(bobCoin.payoutRecipient(), bob);
        
        // Test that they have claimable amounts
        assertTrue(aliceCoin.getClaimableAmount() > 0, "Alice coin should have claimable amount");
        assertTrue(bobCoin.getClaimableAmount() > 0, "Bob coin should have claimable amount");
        
        console.log("Alice coin claimable amount:", aliceCoin.getClaimableAmount());
        console.log("Bob coin claimable amount:", bobCoin.getClaimableAmount());
    }

    function testValidateCreatorStakeLogic() public {
        // This tests the logic that Blitz._validateCreatorStake uses
        
        // Cast to ICreatorCoin interface for testing
        ICreatorCoin aliceICoin = ICreatorCoin(address(aliceCoin));
        ICreatorCoin bobICoin = ICreatorCoin(address(bobCoin));
        
        // 1. Check payout recipient matches
        assertEq(aliceICoin.payoutRecipient(), alice, "Alice should be payout recipient");
        assertEq(bobICoin.payoutRecipient(), bob, "Bob should be payout recipient");
        
        // 2. Check claimable amount > 0
        uint256 aliceClaimable = aliceICoin.getClaimableAmount();
        uint256 bobClaimable = bobICoin.getClaimableAmount();
        
        assertTrue(aliceClaimable > 0, "Alice should have claimable amount");
        assertTrue(bobClaimable > 0, "Bob should have claimable amount");
        
        // 3. Calculate required stake (10% of claimable)
        uint256 aliceRequiredStake = (aliceClaimable * 10) / 100;
        uint256 bobRequiredStake = (bobClaimable * 10) / 100;
        
        console.log("Alice required stake:", aliceRequiredStake);
        console.log("Bob required stake:", bobRequiredStake);
        
        assertEq(aliceRequiredStake, 10000 * 10**18, "Alice stake should be 10% of claimable");
        assertEq(bobRequiredStake, 10000 * 10**18, "Bob stake should be 10% of claimable");
    }

    function testPrepareForBlitzContest() public {
        // Simulate preparing tokens for a Blitz contest
        uint256 aliceStake = (aliceCoin.getClaimableAmount() * 10) / 100;
        uint256 bobStake = (bobCoin.getClaimableAmount() * 10) / 100;
        
        // The tokens are initially held by the coin contracts, so transfer from them
        vm.prank(address(aliceCoin));
        aliceCoin.transfer(depositor, aliceStake);
        
        vm.prank(address(bobCoin));
        bobCoin.transfer(depositor, bobStake);
        
        // Then transfer stakes to the Blitz contract (simulating deposits)
        vm.startPrank(depositor);
        aliceCoin.transfer(address(blitz), aliceStake);
        bobCoin.transfer(address(blitz), bobStake);
        vm.stopPrank();
        
        // Verify Blitz contract has the tokens
        assertEq(aliceCoin.balanceOf(address(blitz)), aliceStake, "Blitz should hold Alice's stake");
        assertEq(bobCoin.balanceOf(address(blitz)), bobStake, "Blitz should hold Bob's stake");
        
        console.log("Blitz contract Alice coin balance:", aliceCoin.balanceOf(address(blitz)));
        console.log("Blitz contract Bob coin balance:", bobCoin.balanceOf(address(blitz)));
    }

    function testCreatorVesting() public {
        // Test the vesting functionality
        uint256 initialClaimable = aliceCoin.getClaimableAmount();
        
        vm.startPrank(alice);
        uint256 claimed = aliceCoin.claimVesting();
        vm.stopPrank();
        
        assertEq(claimed, initialClaimable, "Should claim all available tokens");
        assertEq(aliceCoin.getClaimableAmount(), 0, "No more tokens should be claimable");
        assertEq(aliceCoin.balanceOf(alice), initialClaimable, "Alice should receive the tokens");
    }

    function testCompleteDeployCreatorCoinFlow() public {
        // This test demonstrates the complete flow that would happen in practice:
        
        console.log("\n=== Complete DeployCreatorCoin Flow ===");
        
        // 1. Creator deploys their coin (already done in setUp)
        console.log("1. CreatorCoins deployed:");
        console.log("   Alice coin:", address(aliceCoin));
        console.log("   Bob coin:", address(bobCoin));
        
        // 2. Verify creator ownership
        assertEq(aliceCoin.payoutRecipient(), alice, "Alice owns her coin");
        assertEq(bobCoin.payoutRecipient(), bob, "Bob owns his coin");
        console.log("2. Creator ownership verified");
        
        // 3. Check vesting status (this is what _validateCreatorStake checks)
        ICreatorCoin aliceICoin = ICreatorCoin(address(aliceCoin));
        ICreatorCoin bobICoin = ICreatorCoin(address(bobCoin));
        
        uint256 aliceClaimable = aliceICoin.getClaimableAmount();
        uint256 bobClaimable = bobICoin.getClaimableAmount();
        
        assertTrue(aliceClaimable > 0, "Alice has claimable vested tokens");
        assertTrue(bobClaimable > 0, "Bob has claimable vested tokens");
        console.log("3. Vesting status verified - both have claimable tokens");
        
        // 4. Calculate required stakes (10% of claimable as per Blitz logic)
        uint256 aliceStake = (aliceClaimable * 10) / 100;
        uint256 bobStake = (bobClaimable * 10) / 100;
        
        console.log("4. Required stakes calculated:");
        console.log("   Alice stake:", aliceStake);
        console.log("   Bob stake:", bobStake);
        
        // 5. Deposit stakes into Blitz contract (simulating the deposit flow)
        // In practice, creators would call some deposit function
        vm.prank(address(aliceCoin));
        aliceCoin.transfer(address(blitz), aliceStake);
        
        vm.prank(address(bobCoin));
        bobCoin.transfer(address(blitz), bobStake);
        
        console.log("5. Stakes deposited to Blitz contract");
        
        // 6. Verify Blitz contract has sufficient balance for both stakes
        // This is what startContest() checks before creating a battle
        assertTrue(
            aliceCoin.balanceOf(address(blitz)) >= aliceStake,
            "Blitz has sufficient Alice tokens"
        );
        assertTrue(
            bobCoin.balanceOf(address(blitz)) >= bobStake,
            "Blitz has sufficient Bob tokens"
        );
        
        console.log("6. Blitz contract balance verification complete");
        console.log("   Alice tokens in Blitz:", aliceCoin.balanceOf(address(blitz)));
        console.log("   Bob tokens in Blitz:", bobCoin.balanceOf(address(blitz)));
        
        // 7. At this point, startContest() could be called successfully
        // The _validateCreatorStake logic would pass for both creators
        console.log("7. Ready for Blitz contest - all preconditions met!");
        
        console.log("=== Flow Complete ===\n");
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // HELPER FUNCTIONS FOR STARTCONTEST TESTING
    // ══════════════════════════════════════════════════════════════════════════════

    /// @notice Fund the Blitz contract with creator coin stakes
    function fundBlitzContract() internal {
        uint256 aliceStake = (aliceCoin.getClaimableAmount() * 10) / 100;
        uint256 bobStake = (bobCoin.getClaimableAmount() * 10) / 100;
        
        // Transfer stakes from coin contracts to Blitz
        vm.prank(address(aliceCoin));
        aliceCoin.transfer(address(blitz), aliceStake);
        
        vm.prank(address(bobCoin));
        bobCoin.transfer(address(blitz), bobStake);
    }

    /// @notice Create a creator coin with wrong payout recipient for negative testing
    function createInvalidCreatorCoin(address creator, address wrongRecipient) internal returns (MockCreatorCoin) {
        string memory name = string(abi.encodePacked("Invalid ", vm.toString(creator)));
        string memory symbol = "INVALID";
        uint256 claimableAmount = 50000 * 10**18;
        
        return new MockCreatorCoin(name, symbol, wrongRecipient, claimableAmount);
    }

    /// @notice Get battle details from the battles mapping (updated for packed struct)
    function getBattle(bytes32 battleId) internal view returns (Battle memory battle) {
        (
            battle.battleId,
            battle.playerOne,
            battle.playerOneStake,
            battle.playerTwo,
            battle.playerTwoStake,
            battle.playerOneCoin,
            battle.startTime,
            battle.playerTwoCoin,
            battle.endTime,
            battle.winner,
            battle.state,
            battle.reserved
        ) = blitz.battles(battleId);
    }

    /// @notice Get active battle ID between two players (canonical ordering)
    function getActiveBattle(address playerOne, address playerTwo) internal view returns (bytes32) {
        // Use canonical ordering to match the optimized contract logic
        (address first, address second) = playerOne < playerTwo ? (playerOne, playerTwo) : (playerTwo, playerOne);
        return blitz.activeBattles(first, second);
    }

    /// @notice Generate battle ID for testing (matches Blitz contract logic)
    function generateTestBattleId(address playerOne, address playerTwo, uint256 nonce) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(playerOne, playerTwo, nonce));
    }

    /// @notice Verify battle struct has expected values
    function assertBattleEquals(
        Battle memory battle,
        bytes32 expectedBattleId,
        address expectedPlayerOne,
        address expectedPlayerTwo,
        address expectedPlayerOneCoin,
        address expectedPlayerTwoCoin,
        uint256 expectedPlayerOneStake,
        uint256 expectedPlayerTwoStake
    ) internal {
        assertEq(battle.battleId, expectedBattleId, "Battle ID mismatch");
        assertEq(battle.playerOne, expectedPlayerOne, "Player one mismatch");
        assertEq(battle.playerTwo, expectedPlayerTwo, "Player two mismatch");
        assertEq(battle.playerOneCoin, expectedPlayerOneCoin, "Player one coin mismatch");
        assertEq(battle.playerTwoCoin, expectedPlayerTwoCoin, "Player two coin mismatch");
        assertEq(battle.playerOneStake, expectedPlayerOneStake, "Player one stake mismatch");
        assertEq(battle.playerTwoStake, expectedPlayerTwoStake, "Player two stake mismatch");
        assertEq(uint256(battle.state), uint256(BattleState.CHALLENGE_PERIOD), "Battle state should be CHALLENGE_PERIOD");
        assertEq(battle.winner, address(0), "Winner should be zero initially");
        assertTrue(battle.startTime > 0, "Start time should be set");
        assertTrue(battle.endTime > battle.startTime, "End time should be after start time");
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // STARTCONTEST TESTS
    // ══════════════════════════════════════════════════════════════════════════════

    function testStartContestSuccess() public {
        console.log("\n=== Testing startContest Success ===");
        
        // Setup: Fund the Blitz contract with stakes
        fundBlitzContract();
        
        // Calculate expected stakes
        uint256 aliceStake = (aliceCoin.getClaimableAmount() * 10) / 100;
        uint256 bobStake = (bobCoin.getClaimableAmount() * 10) / 100;
        
        console.log("Expected Alice stake:", aliceStake);
        console.log("Expected Bob stake:", bobStake);
        
        // Verify preconditions
        assertEq(aliceCoin.balanceOf(address(blitz)), aliceStake, "Blitz should have Alice stake");
        assertEq(bobCoin.balanceOf(address(blitz)), bobStake, "Blitz should have Bob stake");
        assertEq(getActiveBattle(alice, bob), bytes32(0), "No active battle should exist");
        
        // Setup event expectations - we can only check the first 3 indexed parameters
        // since battleId is generated during the call
        vm.expectEmit(true, true, true, false);
        emit TokensLocked(alice, address(aliceCoin), aliceStake, bytes32(0)); // battleId will be different
        
        vm.expectEmit(true, true, true, false);
        emit TokensLocked(bob, address(bobCoin), bobStake, bytes32(0)); // battleId will be different
        
        vm.expectEmit(false, false, false, true);
        emit BattleCreated(0, alice, bob); // battleId will be different but players match
        
        // Record timestamp before call for battleId generation
        uint256 callTimestamp = block.timestamp;
        
        // Execute startContest
        bytes32 battleId = blitz.startContest(alice, bob, address(aliceCoin), address(bobCoin));
        
        console.log("Generated battle ID:", vm.toString(battleId));
        
        // Verify battle ID generation (should match internal generateBattleId logic)
        bytes32 expectedBattleId = generateTestBattleId(alice, bob, callTimestamp);
        assertEq(battleId, expectedBattleId, "Battle ID should match expected generation");
        
        // Verify battle was created correctly
        Battle memory battle = getBattle(battleId);
        assertBattleEquals(
            battle,
            battleId,
            alice,
            bob,
            address(aliceCoin),
            address(bobCoin),
            aliceStake,
            bobStake
        );
        
        // Verify active battle tracking
        assertEq(getActiveBattle(alice, bob), battleId, "Active battle should be set (alice -> bob)");
        assertEq(getActiveBattle(bob, alice), battleId, "Active battle should be set (bob -> alice)");
        
        // Verify battle timing
        uint256 expectedEndTime = battle.startTime + blitz.battleDuration();
        assertEq(battle.endTime, expectedEndTime, "End time should be start time + battle duration");
        
        console.log("Battle created successfully:");
        console.log("  Start time:", battle.startTime);
        console.log("  End time:", battle.endTime);
        console.log("  Duration:", battle.endTime - battle.startTime);
        console.log("=== Success Test Complete ===\n");
    }

    function testStartContestInsufficientBalance() public {
        console.log("\n=== Testing startContest Insufficient Balance ===");
        
        // Don't fund the Blitz contract - should fail with insufficient balance
        
        vm.expectRevert("Contract: insufficient tokens");
        blitz.startContest(alice, bob, address(aliceCoin), address(bobCoin));
        
        // Fund only Alice's stake
        uint256 aliceStake = (aliceCoin.getClaimableAmount() * 10) / 100;
        vm.prank(address(aliceCoin));
        aliceCoin.transfer(address(blitz), aliceStake);
        
        // Should still fail for Bob's insufficient balance
        vm.expectRevert("Contract: insufficient tokens");
        blitz.startContest(alice, bob, address(aliceCoin), address(bobCoin));
        
        console.log("=== Insufficient Balance Test Complete ===\n");
    }

    function testStartContestInvalidCreator() public {
        console.log("\n=== Testing startContest Invalid Creator ===");
        
        // Create a coin with wrong payout recipient
        address wrongRecipient = makeAddr("wrongRecipient");
        MockCreatorCoin invalidCoin = createInvalidCreatorCoin(alice, wrongRecipient);
        
        // Fund the contract
        uint256 invalidStake = (invalidCoin.getClaimableAmount() * 10) / 100;
        vm.prank(address(invalidCoin));
        invalidCoin.transfer(address(blitz), invalidStake);
        
        fundBlitzContract(); // Fund for Bob's valid coin
        
        // Should fail because Alice is not the payout recipient of invalidCoin
        vm.expectRevert("Creator not coin owner");
        blitz.startContest(alice, bob, address(invalidCoin), address(bobCoin));
        
        console.log("=== Invalid Creator Test Complete ===\n");
    }

    function testStartContestNoClaimableAmount() public {
        console.log("\n=== Testing startContest No Claimable Amount ===");
        
        // Create a coin with zero claimable amount
        MockCreatorCoin zeroCoin = new MockCreatorCoin("Zero", "ZERO", alice, 0);
        
        // Should fail because there are no claimable vested tokens
        vm.expectRevert("No claimable vested tokens");
        blitz.startContest(alice, bob, address(zeroCoin), address(bobCoin));
        
        console.log("=== No Claimable Amount Test Complete ===\n");
    }

    function testStartContestSelfChallenge() public {
        console.log("\n=== Testing startContest Self Challenge ===");
        
        fundBlitzContract();
        
        // Should fail when player tries to challenge themselves
        vm.expectRevert("Cannot challenge self");
        blitz.startContest(alice, alice, address(aliceCoin), address(aliceCoin));
        
        console.log("=== Self Challenge Test Complete ===\n");
    }

    function testStartContestInvalidCoinAddresses() public {
        console.log("\n=== Testing startContest Invalid Coin Addresses ===");
        
        fundBlitzContract();
        
        // Should fail with zero address for coin
        vm.expectRevert("Invalid coin addresses");
        blitz.startContest(alice, bob, address(0), address(bobCoin));
        
        vm.expectRevert("Invalid coin addresses");
        blitz.startContest(alice, bob, address(aliceCoin), address(0));
        
        console.log("=== Invalid Coin Addresses Test Complete ===\n");
    }

    function testStartContestDuplicateBattle() public {
        console.log("\n=== Testing startContest Duplicate Battle ===");
        
        fundBlitzContract();
        
        // Start first contest
        bytes32 battleId1 = blitz.startContest(alice, bob, address(aliceCoin), address(bobCoin));
        console.log("First battle ID:", vm.toString(battleId1));
        
        // Try to start another contest between same players - should fail
        vm.expectRevert("Active battle already exists");
        blitz.startContest(alice, bob, address(aliceCoin), address(bobCoin));
        
        // Should also fail in reverse order
        vm.expectRevert("Active battle already exists");
        blitz.startContest(bob, alice, address(bobCoin), address(aliceCoin));
        
        console.log("=== Duplicate Battle Test Complete ===\n");
    }

    function testStartContestEventEmission() public {
        console.log("\n=== Testing startContest Event Emission ===");
        
        fundBlitzContract();
        
        uint256 aliceStake = (aliceCoin.getClaimableAmount() * 10) / 100;
        uint256 bobStake = (bobCoin.getClaimableAmount() * 10) / 100;
        uint256 callTimestamp = block.timestamp;
        
        // Generate expected battle ID
        bytes32 expectedBattleId = generateTestBattleId(alice, bob, callTimestamp);
        
        // Set up precise event expectations
        vm.expectEmit(true, true, true, true);
        emit TokensLocked(alice, address(aliceCoin), aliceStake, expectedBattleId);
        
        vm.expectEmit(true, true, true, true);
        emit TokensLocked(bob, address(bobCoin), bobStake, expectedBattleId);
        
        // BattleCreated event expects uint256 battleId, not bytes32
        vm.expectEmit(true, false, false, true);
        emit BattleCreated(uint256(expectedBattleId), alice, bob);
        
        // Execute and verify events are emitted
        bytes32 actualBattleId = blitz.startContest(alice, bob, address(aliceCoin), address(bobCoin));
        
        assertEq(actualBattleId, expectedBattleId, "Battle ID should match expected");
        
        console.log("All events emitted correctly");
        console.log("=== Event Emission Test Complete ===\n");
    }

    function testStartContestBattleStateCreation() public {
        console.log("\n=== Testing startContest Battle State Creation ===");
        
        fundBlitzContract();
        
        // Record pre-conditions
        uint256 aliceStake = (aliceCoin.getClaimableAmount() * 10) / 100;
        uint256 bobStake = (bobCoin.getClaimableAmount() * 10) / 100;
        uint256 preCallTimestamp = block.timestamp;
        uint256 battleDuration = blitz.battleDuration();
        
        // Verify no battle exists initially
        assertEq(getActiveBattle(alice, bob), bytes32(0), "No active battle initially");
        assertEq(getActiveBattle(bob, alice), bytes32(0), "No reverse active battle initially");
        
        // Start contest
        bytes32 battleId = blitz.startContest(alice, bob, address(aliceCoin), address(bobCoin));
        
        // Verify battle state creation
        Battle memory battle = getBattle(battleId);
        
        // Comprehensive state verification
        assertEq(battle.battleId, battleId, "Battle ID set correctly");
        assertEq(battle.playerOne, alice, "Player one set correctly");
        assertEq(battle.playerTwo, bob, "Player two set correctly");
        assertEq(battle.playerOneCoin, address(aliceCoin), "Player one coin set correctly");
        assertEq(battle.playerTwoCoin, address(bobCoin), "Player two coin set correctly");
        assertEq(battle.playerOneStake, aliceStake, "Player one stake set correctly");
        assertEq(battle.playerTwoStake, bobStake, "Player two stake set correctly");
        assertEq(uint256(battle.state), uint256(BattleState.CHALLENGE_PERIOD), "Battle state is CHALLENGE_PERIOD");
        assertEq(battle.winner, address(0), "Winner initially zero");
        
        // Verify timing
        assertTrue(battle.startTime >= preCallTimestamp, "Start time should be >= call time");
        assertEq(battle.endTime, battle.startTime + battleDuration, "End time should be start + duration");
        
        // Verify active battle mappings
        assertEq(getActiveBattle(alice, bob), battleId, "Active battle set (alice->bob)");
        assertEq(getActiveBattle(bob, alice), battleId, "Active battle set (bob->alice)");
        
        console.log("Battle state verification:");
        console.log("  Battle ID:", vm.toString(battle.battleId));
        console.log("  Player One:", battle.playerOne);
        console.log("  Player Two:", battle.playerTwo);
        console.log("  State:", uint256(battle.state));
        console.log("  Alice Stake:", battle.playerOneStake);
        console.log("  Bob Stake:", battle.playerTwoStake);
        console.log("  Start Time:", battle.startTime);
        console.log("  End Time:", battle.endTime);
        console.log("  Duration:", battle.endTime - battle.startTime);
        
        console.log("=== Battle State Creation Test Complete ===\n");
    }

    function testGasOptimizationsComparison() public {
        console.log("\n=== Gas Optimizations Comparison ===");
        
        fundBlitzContract();
        
        // Measure gas for optimized startContest
        uint256 gasBefore = gasleft();
        bytes32 battleId = blitz.startContest(alice, bob, address(aliceCoin), address(bobCoin));
        uint256 gasAfter = gasleft();
        uint256 gasUsed = gasBefore - gasAfter;
        
        console.log("Optimized startContest gas usage:", gasUsed);
        console.log("Battle ID:", vm.toString(battleId));
        
        // Verify the battle was created correctly
        Battle memory battle = getBattle(battleId);
        assertTrue(battle.battleId != bytes32(0), "Battle should be created");
        assertEq(battle.playerOne, alice, "Player one should be Alice");
        assertEq(battle.playerTwo, bob, "Player two should be Bob");
        
        console.log("Battle verification:");
        console.log("  Player One Stake:", uint256(battle.playerOneStake));
        console.log("  Player Two Stake:", uint256(battle.playerTwoStake));
        console.log("  Start Time:", uint256(battle.startTime));
        console.log("  End Time:", uint256(battle.endTime));
        
        // Key optimizations implemented:
        console.log("\nOptimizations implemented:");
        console.log("- Cached external calls (no redundant balanceOf calls)");
        console.log("- Battle struct packed (6 storage slots vs 11)");
        console.log("- Single-direction mapping (1 write vs 2)");
        console.log("- Early validation ordering (fail fast)");
        
        console.log("=== Gas Optimizations Test Complete ===\n");
    }
}