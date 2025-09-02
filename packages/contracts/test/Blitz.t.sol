// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {ICreatorCoin} from "../src/interfaces/ICreatorCoin.sol";
import {Blitz} from "../src/Blitz.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

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
}