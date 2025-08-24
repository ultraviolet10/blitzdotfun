// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ICreatorCoin} from "@zora/interfaces/ICreatorCoin.sol";
import {ICoin} from "@zora/interfaces/ICoin.sol";

// Extended interface to access vesting functions
interface ICreatorCoinExtended is ICreatorCoin, IERC20 {
    function getClaimableAmount() external view returns (uint256);
    function vestingStartTime() external view returns (uint256);
    function vestingEndTime() external view returns (uint256);
    function totalClaimed() external view returns (uint256);
}

contract Flip2 is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    event BattleCreated(uint256 indexed battleId, address playerOne, address playerTwo);
    event BattleCompleted(bytes32 indexed battleId, address winner);
    event TokensDeposited(address indexed creator, address indexed coinAddress, uint256 amount);
    event TokensWithdrawn(address indexed creator, address indexed coinAddress, uint256 amount);
    event TokensLocked(address indexed creator, address indexed coinAddress, uint256 amount, bytes32 battleId);
    event TokensUnlocked(address indexed creator, address indexed coinAddress, uint256 amount, bytes32 battleId);
    event VestedTokensClaimed(address indexed user, address indexed token, uint256 amount);
    event VestingScheduleCreated(address indexed user, address indexed token, uint256 amount, uint256 duration);
    event TimelockWithdrawalCreated(address indexed user, address indexed token, uint256 amount, uint256 unlockTime);
    event TimelockWithdrawalClaimed(address indexed user, address indexed token, uint256 amount);
    event TierRewardsDistributed(bytes32 indexed battleId, uint256 tier, uint256 totalAmount);
    event TraderIncentivesDistributed(bytes32 indexed battleId, address[] traders, uint256[] amounts);

    enum BattleState {
        CHALLENGE_PERIOD, // Creators can stake
        TRADING_PERIOD, // Public trading active
        SCORING_PERIOD, // Calculate winner, no trading
        COMPLETED, // Prizes distributed
        CANCELLED // Emergency state

    }

    struct Battle {
        bytes32 battleId;
        address playerOne;
        address playerTwo;
        BattleState state;
        uint256 startTime;
        uint256 endTime;
        address playerOneCoin;
        address playerTwoCoin;
        uint256 playerOneStake;
        uint256 playerTwoStake;
        address winner;
    }

    struct VestingSchedule {
        uint256 totalAmount;
        uint256 claimed;
        uint256 startTime;
        uint256 duration; // 30 days for winners
    }

    struct TradingFeeAccumulator {
        uint256 totalAccumulatedFees;
        uint256 startTime;
        uint256 endTime;
    }

    struct TimelockWithdrawal {
        uint256 amount;
        uint256 unlockTime; // 7 days for losers
    }

    mapping(bytes32 => Battle) public battles;
    mapping(address => mapping(address => bytes32)) public activeBattles;

    // Vault mappings: creator => coinAddress => amount
    mapping(address => mapping(address => uint256)) public depositedTokens;
    mapping(address => mapping(address => uint256)) public lockedTokens;
    // Vesting schedules for time-locked rewards
    mapping(address => mapping(address => VestingSchedule)) public vestingSchedules;

    // Fee accumulation tracking during contests
    mapping(bytes32 => TradingFeeAccumulator) public battleFeeData;

    // Top trader tracking for volume incentives
    mapping(bytes32 => address[]) public battleTopTraders;
    mapping(bytes32 => mapping(address => uint256)) public traderVolumes;

    // Timelock withdrawals for losers
    mapping(address => mapping(address => TimelockWithdrawal)) public timelockWithdrawals;

    uint256 public constant BATTLE_DURATION = 12 hours; // [uv1000] to be updated with by owner, needs a write function
    // Tier 1: Winner Rewards (70%)
    uint256 public constant WINNER_LIQUID_BPS = 5000; // 50% immediate liquid
    uint256 public constant WINNER_COLLECTOR_BPS = 1500; // 15% to collectors
    uint256 public constant WINNER_VESTING_BPS = 500; // 5% time-locked vesting

    // Tier 2: Flywheel Amplification (15%)
    uint256 public constant FLYWHEEL_FEES_BPS = 1000; // 10% trading fee accumulation
    uint256 public constant FLYWHEEL_BOOST_BPS = 500; // 5% creator coin backing boost

    // Tier 3: Ecosystem Support (15%)
    uint256 public constant LOSER_CONSOLATION_BPS = 1000; // 10% loser consolation
    uint256 public constant TRADER_INCENTIVE_BPS = 300; // 3% volume incentives
    uint256 public constant PROTOCOL_TREASURY_BPS = 200; // 2% protocol treasury

    // Time and limit constants
    uint256 public constant VESTING_DURATION = 30 days; // Winner vesting period
    uint256 public constant LOSER_COOLDOWN = 7 days; // Loser withdrawal cooldown
    uint256 public constant MAX_TOP_TRADERS = 5; // Gas optimization limit

    // what is the `constructor` vs `initialize` paradigm? what works when?
    constructor() {
        // oracle setup
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function generateBattleId(address playerOne, address playerTwo, uint256 nonce) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(playerOne, playerTwo, nonce));
    }

    /// @notice Deposit creator tokens into the vault for future battles
    /// @param coinAddress The creator coin contract address
    /// @param amount The amount of tokens to deposit
    function depositCreatorTokens(address coinAddress, uint256 amount) external nonReentrant {
        require(coinAddress != address(0), "Invalid coin address");
        require(amount > 0, "Amount must be greater than zero");

        ICreatorCoinExtended creatorCoin = ICreatorCoinExtended(coinAddress);

        // Verify the caller is the payout recipient of this coin
        require(creatorCoin.payoutRecipient() == msg.sender, "Not coin owner");

        // Transfer tokens from creator to this contract
        IERC20(coinAddress).safeTransferFrom(msg.sender, address(this), amount);

        // Update deposited balance
        depositedTokens[msg.sender][coinAddress] += amount;

        emit TokensDeposited(msg.sender, coinAddress, amount);
    }

    /// @notice Withdraw available creator tokens from the vault
    /// @param coinAddress The creator coin contract address
    /// @param amount The amount of tokens to withdraw (0 = withdraw all available)
    function withdrawCreatorTokens(address coinAddress, uint256 amount) external nonReentrant {
        require(coinAddress != address(0), "Invalid coin address");

        uint256 availableBalance = depositedTokens[msg.sender][coinAddress];
        require(availableBalance > 0, "No tokens available for withdrawal");

        // If amount is 0, withdraw all available tokens
        if (amount == 0 || amount > availableBalance) {
            amount = availableBalance;
        }

        // Update deposited balance
        depositedTokens[msg.sender][coinAddress] -= amount;

        // Transfer tokens back to creator
        IERC20(coinAddress).safeTransfer(msg.sender, amount);

        emit TokensWithdrawn(msg.sender, coinAddress, amount);
    }

    // startContest
    // -> check that the contract holds one percent of their token holdings
    // -> if yes,

    function startContest(address playerOne, address playerTwo, address playerOneCoin, address playerTwoCoin)
        external
        returns (bytes32 battleId)
    {
        require(playerOne != playerTwo, "Cannot challenge self");
        require(playerOneCoin != address(0) && playerTwoCoin != address(0), "Invalid coin addresses");

        // Check no active battle exists between these players
        require(activeBattles[playerOne][playerTwo] == 0, "Active battle already exists");
        require(activeBattles[playerTwo][playerOne] == 0, "Active battle already exists");

        // Validate stakes and get required amounts
        uint256 playerOneStake = _validateCreatorStake(playerOne, playerOneCoin);
        uint256 playerTwoStake = _validateCreatorStake(playerTwo, playerTwoCoin);

        // Check deposited tokens are sufficient
        require(
            depositedTokens[playerOne][playerOneCoin] >= playerOneStake, "Player one: insufficient deposited tokens"
        );
        require(
            depositedTokens[playerTwo][playerTwoCoin] >= playerTwoStake, "Player two: insufficient deposited tokens"
        );

        battleId = generateBattleId(playerOne, playerTwo, block.timestamp);

        // Lock tokens by moving from deposited to locked
        depositedTokens[playerOne][playerOneCoin] -= playerOneStake;
        lockedTokens[playerOne][playerOneCoin] += playerOneStake;
        depositedTokens[playerTwo][playerTwoCoin] -= playerTwoStake;
        lockedTokens[playerTwo][playerTwoCoin] += playerTwoStake;

        battles[battleId] = Battle({
            battleId: battleId,
            playerOne: playerOne,
            playerTwo: playerTwo,
            state: BattleState.CHALLENGE_PERIOD,
            startTime: block.timestamp,
            endTime: block.timestamp + BATTLE_DURATION,
            playerOneCoin: playerOneCoin,
            playerTwoCoin: playerTwoCoin,
            playerOneStake: playerOneStake,
            playerTwoStake: playerTwoStake,
            winner: address(0)
        });

        // Track active battle between these players
        activeBattles[playerOne][playerTwo] = battleId;
        activeBattles[playerTwo][playerOne] = battleId;

        // Emit lock events
        emit TokensLocked(playerOne, playerOneCoin, playerOneStake, battleId);
        emit TokensLocked(playerTwo, playerTwoCoin, playerTwoStake, battleId);
        emit BattleCreated(uint256(battleId), playerOne, playerTwo);

        return battleId;
    }

    /// @notice End a contest and distribute prizes using enhanced multi-tier system
    /// @param battleId The battle to end
    /// @param playerOneScore Trading volume score for player one (basis points)
    /// @param playerTwoScore Trading volume score for player two (basis points)
    /// @param topCollectors Array of top collector addresses for winner's coin
    /// @param collectorBalances Array of token balances for each collector
    function endContest(
        bytes32 battleId,
        uint256 playerOneScore,
        uint256 playerTwoScore,
        address[] calldata topCollectors,
        uint256[] calldata collectorBalances
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        Battle storage battle = battles[battleId];

        // Validate battle exists and timing
        require(battle.startTime > 0, "Battle does not exist");
        require(battle.state == BattleState.CHALLENGE_PERIOD, "Battle not in active state");
        require(block.timestamp >= battle.endTime, "Contest still ongoing");

        // Validate collector arrays
        require(topCollectors.length == collectorBalances.length, "Array length mismatch");
        require(topCollectors.length <= 100, "Too many collectors"); // Gas limit protection
        require(playerOneScore != playerTwoScore, "Tie scores not allowed - contest invalid");

        // Determine winner and loser
        address winner;
        address loser;
        address winnerCoin;
        address loserCoin;
        uint256 winnerStake;
        uint256 loserStake;

        if (playerOneScore > playerTwoScore) {
            winner = battle.playerOne;
            loser = battle.playerTwo;
            winnerCoin = battle.playerOneCoin;
            loserCoin = battle.playerTwoCoin;
            winnerStake = battle.playerOneStake;
            loserStake = battle.playerTwoStake;
        } else {
            winner = battle.playerTwo;
            loser = battle.playerOne;
            winnerCoin = battle.playerTwoCoin;
            loserCoin = battle.playerOneCoin;
            winnerStake = battle.playerTwoStake;
            loserStake = battle.playerOneStake;
        }

        // Calculate total prize pool
        uint256 totalPool = winnerStake + loserStake;

        // CRITICAL: Unlock tokens from locked state first
        lockedTokens[winner][winnerCoin] -= winnerStake;
        lockedTokens[loser][loserCoin] -= loserStake;

        // Execute three-tier distribution system
        _distributeTier1WinnerRewards(
            battleId, winner, winnerCoin, loserCoin, totalPool, topCollectors, collectorBalances
        );
        _distributeTier2FlywheelRewards(battleId, winner, winnerCoin, loserCoin, totalPool);
        _distributeTier3EcosystemRewards(battleId, loser, loserCoin, totalPool);

        // Update battle state
        battle.winner = winner;
        battle.state = BattleState.COMPLETED;

        // Clear active battle tracking
        activeBattles[battle.playerOne][battle.playerTwo] = 0;
        activeBattles[battle.playerTwo][battle.playerOne] = 0;

        emit BattleCompleted(battleId, winner);
    }

    /// @notice Claim available vested tokens from winner rewards
    /// @param tokenAddress The token contract address to claim from
    function claimVestedTokens(address tokenAddress) external nonReentrant {
        require(tokenAddress != address(0), "Invalid token address");
        // probably better coin identification mechanisms

        VestingSchedule storage schedule = vestingSchedules[msg.sender][tokenAddress];
        require(schedule.totalAmount > 0, "No vesting schedule");

        uint256 vested = _calculateVestedAmount(schedule);
        uint256 claimable = vested - schedule.claimed;
        require(claimable > 0, "Nothing to claim");

        schedule.claimed = vested;
        depositedTokens[msg.sender][tokenAddress] += claimable;

        emit VestedTokensClaimed(msg.sender, tokenAddress, claimable);
    }

    /// @notice Calculate how much has vested for a given schedule
    /// @param schedule The vesting schedule to calculate for
    /// @return The total amount that has vested so far
    function _calculateVestedAmount(VestingSchedule memory schedule) internal view returns (uint256) {
        if (block.timestamp >= schedule.startTime + schedule.duration) {
            return schedule.totalAmount; // Fully vested
        }

        uint256 elapsed = block.timestamp - schedule.startTime;
        return (schedule.totalAmount * elapsed) / schedule.duration;
    }

    /// @notice Claim timelock withdrawal after cooldown period (for losers)
    /// @param tokenAddress The token contract address to claim from
    function claimTimelockWithdrawal(address tokenAddress) external nonReentrant {
        require(tokenAddress != address(0), "Invalid token address");

        TimelockWithdrawal storage withdrawal = timelockWithdrawals[msg.sender][tokenAddress];
        require(withdrawal.amount > 0, "No timelock withdrawal");
        require(block.timestamp >= withdrawal.unlockTime, "Still in cooldown period");

        uint256 amount = withdrawal.amount;

        // Clear the timelock withdrawal
        delete timelockWithdrawals[msg.sender][tokenAddress];

        // Add to deposited tokens for withdrawal
        depositedTokens[msg.sender][tokenAddress] += amount;

        emit TimelockWithdrawalClaimed(msg.sender, tokenAddress, amount);
    }

    /// @notice Create a timelock withdrawal for loser consolation
    /// @param user The user who will receive the timelock withdrawal
    /// @param tokenAddress The token contract address
    /// @param amount The amount to be time-locked
    /// @param cooldownPeriod The cooldown period before withdrawal is available
    function _createTimelockWithdrawal(address user, address tokenAddress, uint256 amount, uint256 cooldownPeriod)
        internal
    {
        require(amount > 0, "Amount must be greater than zero");
        require(user != address(0), "Invalid user address");

        // Check if user already has a timelock withdrawal for this token
        require(timelockWithdrawals[user][tokenAddress].amount == 0, "Timelock withdrawal already exists");

        timelockWithdrawals[user][tokenAddress] =
            TimelockWithdrawal({amount: amount, unlockTime: block.timestamp + cooldownPeriod});

        emit TimelockWithdrawalCreated(user, tokenAddress, amount, block.timestamp + cooldownPeriod);
    }

    /// @notice Distribute Tier 1: Winner Rewards (70% of pool)
    /// @param battleId The battle identifier
    /// @param winner The winning creator
    /// @param winnerCoin The winner's coin address
    /// @param loserCoin The loser's coin address
    /// @param totalPool The total prize pool (winner + loser stakes)
    /// @param topCollectors Array of top collector addresses
    /// @param collectorBalances Array of collector token balances
    function _distributeTier1WinnerRewards(
        bytes32 battleId,
        address winner,
        address winnerCoin,
        address loserCoin,
        uint256 totalPool,
        address[] calldata topCollectors,
        uint256[] calldata collectorBalances
    ) internal {
        // 50% immediate liquid to winner
        uint256 liquidAmount = (totalPool * WINNER_LIQUID_BPS) / 10000;
        uint256 winnerLiquidShare = liquidAmount / 2; // Split between winner coin and loser coin
        depositedTokens[winner][winnerCoin] += winnerLiquidShare;
        depositedTokens[winner][loserCoin] += winnerLiquidShare;

        // 15% to content coin holders (existing collector logic)
        uint256 collectorAmount = (totalPool * WINNER_COLLECTOR_BPS) / 10000;
        if (topCollectors.length > 0) {
            _distributeToCollectors(topCollectors, collectorBalances, collectorAmount, winnerCoin);
        }

        // 5% time-locked vesting (30 days)
        uint256 vestingAmount = (totalPool * WINNER_VESTING_BPS) / 10000;
        if (vestingAmount > 0) {
            _createVestingSchedule(winner, winnerCoin, vestingAmount, VESTING_DURATION);
        }

        emit TierRewardsDistributed(battleId, 1, (liquidAmount + collectorAmount + vestingAmount));
    }

    /// @notice Distribute Tier 2: Flywheel Amplification (15% of pool)
    /// @param battleId The battle identifier
    /// @param winner The winning creator
    /// @param winnerCoin The winner's coin address
    /// @param loserCoin The loser's coin address
    /// @param totalPool The total prize pool
    function _distributeTier2FlywheelRewards(
        bytes32 battleId,
        address winner,
        address winnerCoin,
        address loserCoin,
        uint256 totalPool
    ) internal {
        // 10% trading fee accumulation during contest
        uint256 feeReward = (totalPool * FLYWHEEL_FEES_BPS) / 10000;
        TradingFeeAccumulator storage feeData = battleFeeData[battleId];

        if (feeData.totalAccumulatedFees > 0) {
            // Winner gets accumulated fees from BOTH coins
            uint256 feeShare = feeData.totalAccumulatedFees / 2;
            depositedTokens[winner][winnerCoin] += feeShare;
            depositedTokens[winner][loserCoin] += feeShare;
        } else {
            // Fallback: give equivalent from pool
            uint256 fallbackShare = feeReward / 2;
            depositedTokens[winner][winnerCoin] += fallbackShare;
            depositedTokens[winner][loserCoin] += fallbackShare;
        }

        // 5% backing boost (simplified for now - TODO: implement content coin detection)
        uint256 boostAmount = (totalPool * FLYWHEEL_BOOST_BPS) / 10000;
        // For now, give boost directly to winner - will enhance with coin type detection later
        depositedTokens[winner][winnerCoin] += boostAmount;

        emit TierRewardsDistributed(battleId, 2, (feeReward + boostAmount));
    }

    /// @notice Distribute Tier 3: Ecosystem Support (15% of pool)
    /// @param battleId The battle identifier
    /// @param loser The losing creator
    /// @param loserCoin The loser's coin address
    /// @param totalPool The total prize pool
    function _distributeTier3EcosystemRewards(bytes32 battleId, address loser, address loserCoin, uint256 totalPool)
        internal
    {
        // 10% loser consolation (with 7-day cooldown)
        uint256 consolationAmount = (totalPool * LOSER_CONSOLATION_BPS) / 10000;
        _createTimelockWithdrawal(loser, loserCoin, consolationAmount, LOSER_COOLDOWN);

        // 3% volume incentives for top traders
        uint256 traderIncentive = (totalPool * TRADER_INCENTIVE_BPS) / 10000;
        _distributeVolumeIncentives(battleId, traderIncentive);

        // 2% protocol treasury (simplified for now - TODO: implement treasury address)
        uint256 treasuryAmount = (totalPool * PROTOCOL_TREASURY_BPS) / 10000;
        // For now, keep in contract - will implement treasury transfer later

        emit TierRewardsDistributed(battleId, 3, (consolationAmount + traderIncentive + treasuryAmount));
    }

    /// @notice Distribute volume incentives to top traders during contest
    /// @param battleId The battle identifier
    /// @param totalAmount Total amount to distribute
    function _distributeVolumeIncentives(bytes32 battleId, uint256 totalAmount) internal {
        if (totalAmount == 0) return;

        address[] storage topTraders = battleTopTraders[battleId];
        if (topTraders.length == 0) return;

        // For now, distribute equally among recorded traders
        // TODO: Implement volume-weighted distribution when trading tracking is added
        uint256 rewardPerTrader = totalAmount / topTraders.length;
        uint256[] memory amounts = new uint256[](topTraders.length);

        for (uint256 i = 0; i < topTraders.length; i++) {
            if (rewardPerTrader > 0) {
                // Give rewards in winner's coin for simplicity - could be enhanced later
                amounts[i] = rewardPerTrader;
            }
        }

        emit TraderIncentivesDistributed(battleId, topTraders, amounts);
    }

    /// @notice Create a vesting schedule for time-locked rewards
    /// @param beneficiary The address that will receive the vested tokens
    /// @param tokenAddress The token contract address
    /// @param amount The total amount to vest
    /// @param duration The vesting duration
    function _createVestingSchedule(address beneficiary, address tokenAddress, uint256 amount, uint256 duration)
        internal
    {
        require(amount > 0, "Amount must be greater than zero");
        require(beneficiary != address(0), "Invalid beneficiary address");

        // Check if beneficiary already has a vesting schedule for this token
        require(vestingSchedules[beneficiary][tokenAddress].totalAmount == 0, "Vesting schedule already exists");

        vestingSchedules[beneficiary][tokenAddress] =
            VestingSchedule({totalAmount: amount, claimed: 0, startTime: block.timestamp, duration: duration});

        emit VestingScheduleCreated(beneficiary, tokenAddress, amount, duration);
    }

    /// @notice Validates that a creator has sufficient balance and returns required stake
    /// @param creator The creator's address
    /// @param coinAddress The creator's coin contract address
    /// @return requiredStake The amount that needs to be staked (10% of claimable)
    function _validateCreatorStake(address creator, address coinAddress)
        internal
        view
        returns (uint256 requiredStake)
    {
        ICreatorCoinExtended creatorCoin = ICreatorCoinExtended(coinAddress);

        // Verify the creator is the payout recipient of this coin
        require(creatorCoin.payoutRecipient() == creator, "Creator not coin owner");

        // Check that the creator has claimable vested amount (indicates active coin)
        uint256 claimableAmount = creatorCoin.getClaimableAmount();
        require(claimableAmount > 0, "No claimable vested tokens");

        // Calculate required stake (10% of claimable amount)
        requiredStake = (claimableAmount * 10) / 100;

        // Note: We no longer check creator's direct balance since we're using deposited tokens
        // The deposited token balance check is done in startContest

        return requiredStake;
    }

    /// @notice Distribute tokens to collectors based on their weighted holdings
    /// @param collectors Array of collector addresses
    /// @param balances Array of collector token balances
    /// @param totalAmount Total amount to distribute
    /// @param tokenAddress The token contract to distribute
    function _distributeToCollectors(
        address[] calldata collectors,
        uint256[] calldata balances,
        uint256 totalAmount,
        address tokenAddress
    ) internal {
        if (collectors.length == 0 || totalAmount == 0) return;

        // Calculate total balance across all collectors (skip zeros for gas optimization)
        uint256 totalBalance = 0;
        uint256 validCollectors = 0;
        for (uint256 i = 0; i < balances.length; i++) {
            if (balances[i] > 0) {
                totalBalance += balances[i];
                validCollectors++;
            }
        }

        require(totalBalance > 0, "No collector balances");

        // Distribute proportionally to each collector and track remainder
        uint256 distributedTotal = 0;
        address lastCollector;
        uint256 processedCollectors = 0;

        for (uint256 i = 0; i < collectors.length && processedCollectors < validCollectors; i++) {
            if (balances[i] > 0) {
                uint256 collectorShare = (totalAmount * balances[i]) / totalBalance;
                if (collectorShare > 0) {
                    depositedTokens[collectors[i]][tokenAddress] += collectorShare;
                    distributedTotal += collectorShare;
                    lastCollector = collectors[i];
                }
                processedCollectors++;
            }
        }

        // Give any remainder to the last collector to prevent token loss
        uint256 remainder = totalAmount - distributedTotal;
        if (remainder > 0 && lastCollector != address(0)) {
            depositedTokens[lastCollector][tokenAddress] += remainder;
        }
    }
}

/**
 * _Interface vs Concrete Contract Type_
 *
 *   Using Interface (what we have in Flip2.sol):
 *
 *   ICreatorCoin creatorCoin = ICreatorCoin(coinAddress);
 *   // Can only access functions defined in the ICreatorCoin interface
 *
 *   Using Concrete Contract (what the test does):
 *
 *   CreatorCoin internal creatorCoin;
 *   // Later assigned: creatorCoin = CreatorCoin(creatorCoinAddress);
 *   // Can access ALL public/external functions of the CreatorCoin contract
 */
