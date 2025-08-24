// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ICreatorCoin} from "./interfaces/ICreatorCoin.sol";
import {ICoin} from "@zora/interfaces/ICoin.sol";

import {
    InvalidAddress,
    InsufficientBalance,
    BattleNotFound,
    BattleAlreadyExists,
    BattleNotActive,
    ContestStillOngoing,
    InvalidCollectorArrays,
    TieScoresNotAllowed,
    NoVestingSchedule,
    NothingToClaim,
    StillInCooldown,
    TimelockAlreadyExists,
    VestingScheduleAlreadyExists,
    BattleCreated,
    BattleCompleted,
    TokensDeposited,
    TokensWithdrawn,
    TokensLocked,
    TokensUnlocked,
    VestedTokensClaimed,
    VestingScheduleCreated,
    TimelockWithdrawalCreated,
    TimelockWithdrawalClaimed,
    TierRewardsDistributed,
    TraderIncentivesDistributed,
    VolumeTracked,
    TopTraderUpdated,
    VolumeIncentivesDistributedWeighted,
    CollectorBatchProcessed,
    CollectorDistributionCompleted,
    TreasuryAddressUpdated,
    TreasuryWithdrawal,
    EmergencyPause,
    EmergencyUnpause
} from "./interfaces/EventsAndErrors.sol";

import {
    BattleState,
    Battle,
    VestingSchedule,
    TradingFeeAccumulator,
    TimelockWithdrawal,
    TraderActivity,
    TopTrader,
    CollectorReward
} from "./interfaces/Types.sol";

/**
 * @title Blitz - Creator Coin Contest Platform
 * @notice A sophisticated contest platform for creator coin battles with multi-tier reward distribution
 * @dev Implements flywheel-aware distribution mechanics inspired by Zora Protocol architecture
 *
 * @custom:architecture
 * This contract manages creator coin contests with three-tier reward distribution:
 * - Tier 1 (70%): Winner rewards with liquid + vesting + collector distribution
 * - Tier 2 (15%): Flywheel amplification via fee accumulation and backing boosts
 * - Tier 3 (15%): Ecosystem support via loser consolation + trader incentives + protocol treasury
 *
 * @custom:security
 * - Uses AccessControl for admin functions
 * - ReentrancyGuard on all token transfer functions
 * - Time-based vesting and cooldown mechanisms
 * - Gas-optimized collector distribution with limits
 *
 * @custom:integration
 * - Designed for integration with Zora Protocol creator/content coins
 * - Supports ERC20 tokens with SafeERC20 patterns
 * - Event-rich design for off-chain analytics and indexing
 *
 * @author Your Team
 * @custom:version 2.0.0 - Enhanced Multi-Tier Distribution
 */
contract Blitz is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ══════════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ══════════════════════════════════════════════════════════════════════════════
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

    // Enhanced trader activity tracking: battleId => trader => activity data
    mapping(bytes32 => mapping(address => TraderActivity)) public battleTraderActivity;

    // Sorted top traders for efficient distribution: battleId => sorted array
    mapping(bytes32 => TopTrader[]) public battleTopTradersSorted;

    // Total contest volume tracking: battleId => total volume
    mapping(bytes32 => uint256) public battleTotalVolume;

    address public treasuryAddress; // Protocol treasury address
    mapping(address => uint256) public treasuryBalances; // Treasury balances per token

    // ══════════════════════════════════════════════════════════════════════════════
    // CONSTANTS & DISTRIBUTION PARAMETERS
    // ══════════════════════════════════════════════════════════════════════════════
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

    // Volume tracking parameters
    uint256 public constant MIN_TRADE_VOLUME = 1e15; // 0.001 ETH minimum to prevent spam
    uint256 public constant VOLUME_DECAY_RATE = 9500; // 95% retention per hour (prevents early gaming)

    // Oracle role for volume reporting
    bytes32 public constant VOLUME_ORACLE_ROLE = keccak256("VOLUME_ORACLE_ROLE");

    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE"); // Can pause/unpause contract
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE"); // Can manage treasury funds
    bytes32 public constant CONTEST_MODERATOR_ROLE = keccak256("CONTEST_MODERATOR_ROLE"); // Can moderate contests

    uint256 public constant MAX_COLLECTORS_PER_BATCH = 50; // Gas optimization limit per batch
    uint256 public constant MIN_COLLECTOR_REWARD = 1000; // Minimum reward (0.001 tokens) to avoid dust
    uint256 public constant PRECISION_MULTIPLIER = 1e18; // Higher precision for calculations

    // ══════════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR & INITIALIZATION
    // ══════════════════════════════════════════════════════════════════════════════
    constructor() {
        // Grant deployer all initial roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
        _grantRole(TREASURY_ROLE, msg.sender);
        _grantRole(CONTEST_MODERATOR_ROLE, msg.sender);

        // Initialize treasury address to deployer (can be changed later)
        treasuryAddress = msg.sender;
    }

    function generateBattleId(address playerOne, address playerTwo, uint256 nonce) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(playerOne, playerTwo, nonce));
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // VAULT MANAGEMENT FUNCTIONS
    // ══════════════════════════════════════════════════════════════════════════════

    /// @notice Deposit creator tokens into the vault for future battles
    /// @param coinAddress The creator coin contract address
    /// @param amount The amount of tokens to deposit
    function depositCreatorTokens(address coinAddress, uint256 amount) external nonReentrant {
        require(coinAddress != address(0), "Invalid coin address");
        require(amount > 0, "Amount must be greater than zero");

        ICreatorCoin creatorCoin = ICreatorCoin(coinAddress);

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

    // ══════════════════════════════════════════════════════════════════════════════
    // CORE BATTLE FUNCTIONS
    // ══════════════════════════════════════════════════════════════════════════════

    function startContest(address playerOne, address playerTwo, address playerOneCoin, address playerTwoCoin)
        external
        whenNotPaused
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

    /// @notice Record trading volume for a battle (oracle integration point)
    /// @param battleId The battle identifier
    /// @param trader The trader address
    /// @param volume The trading volume to record
    function recordTradeVolume(bytes32 battleId, address trader, uint256 volume)
        external
        onlyRole(VOLUME_ORACLE_ROLE)
    {
        Battle storage battle = battles[battleId];

        // Validate battle state and timing
        require(battle.startTime > 0, "Battle does not exist");
        require(battle.state == BattleState.CHALLENGE_PERIOD, "Battle not active");
        require(block.timestamp <= battle.endTime, "Contest ended");
        require(volume >= MIN_TRADE_VOLUME, "Volume below minimum threshold");
        require(trader != address(0), "Invalid trader address");

        // Get current trader activity
        TraderActivity storage activity = battleTraderActivity[battleId][trader];

        // Apply decay to existing volume if trader was active before
        uint256 decayedVolume = activity.totalVolume;
        if (activity.isActive && activity.lastTradeTime > 0) {
            uint256 hoursElapsed = (block.timestamp - activity.lastTradeTime) / 3600;
            if (hoursElapsed > 0) {
                // Apply decay: volume * (9500/10000) ^ hours
                for (uint256 i = 0; i < hoursElapsed && i < 24; i++) {
                    decayedVolume = (decayedVolume * VOLUME_DECAY_RATE) / 10000;
                }
            }
        }

        // Update trader activity
        activity.totalVolume = decayedVolume + volume;
        activity.lastTradeTime = block.timestamp;
        activity.isActive = true;

        // Update total contest volume
        battleTotalVolume[battleId] += volume;

        // Update top traders list
        _updateTopTraders(battleId, trader, activity.totalVolume);

        emit VolumeTracked(battleId, trader, volume, block.timestamp);
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

    // ══════════════════════════════════════════════════════════════════════════════
    // INTERNAL FUNCTIONS
    // ══════════════════════════════════════════════════════════════════════════════

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

    // ══════════════════════════════════════════════════════════════════════════════
    // VIEW & GETTER FUNCTIONS - Real-time leaderboard and volume tracking
    // ══════════════════════════════════════════════════════════════════════════════

    /// @notice Get top traders for a battle with their current volumes
    /// @param battleId The battle identifier
    /// @return traders Array of trader addresses
    /// @return volumes Array of corresponding volumes
    function getBattleTopTraders(bytes32 battleId)
        external
        view
        returns (address[] memory traders, uint256[] memory volumes)
    {
        TopTrader[] storage topTraders = battleTopTradersSorted[battleId];

        traders = new address[](topTraders.length);
        volumes = new uint256[](topTraders.length);

        for (uint256 i = 0; i < topTraders.length; i++) {
            traders[i] = topTraders[i].trader;
            volumes[i] = topTraders[i].volume;
        }

        return (traders, volumes);
    }

    /// @notice Get a specific trader's volume for a battle
    /// @param battleId The battle identifier
    /// @param trader The trader address
    /// @return volume The trader's total volume (with decay applied)
    function getTraderVolume(bytes32 battleId, address trader) external view returns (uint256 volume) {
        TraderActivity storage activity = battleTraderActivity[battleId][trader];

        if (!activity.isActive || activity.totalVolume == 0) {
            return 0;
        }

        // Apply volume decay based on time elapsed
        uint256 currentVolume = activity.totalVolume;
        if (activity.lastTradeTime > 0) {
            uint256 hoursElapsed = (block.timestamp - activity.lastTradeTime) / 3600;
            if (hoursElapsed > 0) {
                // Apply decay: volume * (9500/10000) ^ hours
                for (uint256 i = 0; i < hoursElapsed && i < 24; i++) {
                    currentVolume = (currentVolume * VOLUME_DECAY_RATE) / 10000;
                }
            }
        }

        return currentVolume;
    }

    /// @notice Get total volume for a battle
    /// @param battleId The battle identifier
    /// @return totalVolume The total volume across all participants
    function getBattleTotalVolume(bytes32 battleId) external view returns (uint256 totalVolume) {
        return battleTotalVolume[battleId];
    }

    /// @notice Get trader's rank in the top traders list
    /// @param battleId The battle identifier
    /// @param trader The trader address
    /// @return rank The trader's rank (1-based), 0 if not in top list
    function getTraderRank(bytes32 battleId, address trader) external view returns (uint256 rank) {
        TopTrader[] storage topTraders = battleTopTradersSorted[battleId];

        for (uint256 i = 0; i < topTraders.length; i++) {
            if (topTraders[i].trader == trader) {
                return i + 1; // 1-based rank
            }
        }

        return 0; // Not in top list
    }

    /// @notice Get comprehensive battle volume statistics
    /// @param battleId The battle identifier
    /// @return totalVolume Total volume across all participants
    /// @return topTraderCount Number of tracked top traders
    /// @return averageTopTraderVolume Average volume among top traders
    /// @return topTraderVolume Volume of the #1 trader
    function getBattleVolumeStats(bytes32 battleId)
        external
        view
        returns (uint256 totalVolume, uint256 topTraderCount, uint256 averageTopTraderVolume, uint256 topTraderVolume)
    {
        totalVolume = battleTotalVolume[battleId];

        TopTrader[] storage topTraders = battleTopTradersSorted[battleId];
        topTraderCount = topTraders.length;

        if (topTraderCount > 0) {
            topTraderVolume = topTraders[0].volume; // Highest volume (sorted descending)

            uint256 totalTopTraderVolume = 0;
            for (uint256 i = 0; i < topTraders.length; i++) {
                totalTopTraderVolume += topTraders[i].volume;
            }
            averageTopTraderVolume = totalTopTraderVolume / topTraderCount;
        }

        return (totalVolume, topTraderCount, averageTopTraderVolume, topTraderVolume);
    }

    /// @notice Get trader activity details including last trade time
    /// @param battleId The battle identifier
    /// @param trader The trader address
    /// @return totalVolume Trader's total volume
    /// @return lastTradeTime Timestamp of last trade
    /// @return isActive Whether trader is currently active
    /// @return currentVolume Volume with decay applied
    function getTraderActivity(bytes32 battleId, address trader)
        external
        view
        returns (uint256 totalVolume, uint256 lastTradeTime, bool isActive, uint256 currentVolume)
    {
        TraderActivity storage activity = battleTraderActivity[battleId][trader];

        totalVolume = activity.totalVolume;
        lastTradeTime = activity.lastTradeTime;
        isActive = activity.isActive;
        currentVolume = this.getTraderVolume(battleId, trader);

        return (totalVolume, lastTradeTime, isActive, currentVolume);
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
        _distributeVolumeIncentivesToAccounts(battleId, traderIncentive, loserCoin);

        // 2% protocol treasury - accumulate in treasury balances
        uint256 treasuryAmount = (totalPool * PROTOCOL_TREASURY_BPS) / 10000;
        if (treasuryAmount > 0) {
            treasuryBalances[loserCoin] += treasuryAmount;
        }

        emit TierRewardsDistributed(battleId, 3, (consolationAmount + traderIncentive + treasuryAmount));
    }

    /// @notice Distribute volume incentives to top traders using volume-weighted calculation
    /// @param battleId The battle identifier
    /// @param totalAmount Total amount to distribute
    function _distributeVolumeIncentives(bytes32 battleId, uint256 totalAmount) internal {
        if (totalAmount == 0) return;

        TopTrader[] storage topTraders = battleTopTradersSorted[battleId];
        if (topTraders.length == 0) return;

        // Calculate total volume among top traders
        uint256 totalTopTraderVolume = 0;
        for (uint256 i = 0; i < topTraders.length; i++) {
            totalTopTraderVolume += topTraders[i].volume;
        }

        if (totalTopTraderVolume == 0) return;

        // Calculate volume-weighted rewards
        address[] memory traderAddresses = new address[](topTraders.length);
        uint256[] memory volumes = new uint256[](topTraders.length);
        uint256[] memory rewards = new uint256[](topTraders.length);
        uint256 distributedTotal = 0;

        for (uint256 i = 0; i < topTraders.length; i++) {
            traderAddresses[i] = topTraders[i].trader;
            volumes[i] = topTraders[i].volume;

            // Calculate proportional reward: (traderVolume / totalVolume) * totalAmount
            uint256 traderReward = (totalAmount * topTraders[i].volume) / totalTopTraderVolume;
            rewards[i] = traderReward;
            distributedTotal += traderReward;

            // TODO: Distribute in appropriate coin (loser's coin for now)
            // Note: This would need the loser's coin address passed to this function
            // For now, we emit the event and let the calling function handle distribution
        }

        // Handle remainder by giving it to the top trader (highest volume)
        if (distributedTotal < totalAmount && topTraders.length > 0) {
            uint256 remainder = totalAmount - distributedTotal;
            rewards[0] += remainder; // Give remainder to #1 trader
        }

        emit VolumeIncentivesDistributedWeighted(battleId, traderAddresses, volumes, rewards);
        emit TraderIncentivesDistributed(battleId, traderAddresses, rewards);
    }

    /// @notice Distribute volume incentives to trader accounts with actual token transfers
    /// @param battleId The battle identifier
    /// @param totalAmount Total amount to distribute
    /// @param rewardToken The token to distribute as rewards
    function _distributeVolumeIncentivesToAccounts(bytes32 battleId, uint256 totalAmount, address rewardToken)
        internal
    {
        if (totalAmount == 0) return;

        TopTrader[] storage topTraders = battleTopTradersSorted[battleId];
        if (topTraders.length == 0) return;

        // Calculate total volume among top traders
        uint256 totalTopTraderVolume = 0;
        for (uint256 i = 0; i < topTraders.length; i++) {
            totalTopTraderVolume += topTraders[i].volume;
        }

        if (totalTopTraderVolume == 0) return;

        // Distribute volume-weighted rewards to trader accounts
        address[] memory traderAddresses = new address[](topTraders.length);
        uint256[] memory volumes = new uint256[](topTraders.length);
        uint256[] memory rewards = new uint256[](topTraders.length);
        uint256 distributedTotal = 0;

        for (uint256 i = 0; i < topTraders.length; i++) {
            traderAddresses[i] = topTraders[i].trader;
            volumes[i] = topTraders[i].volume;

            // Calculate proportional reward: (traderVolume / totalVolume) * totalAmount
            uint256 traderReward = (totalAmount * topTraders[i].volume) / totalTopTraderVolume;
            rewards[i] = traderReward;
            distributedTotal += traderReward;

            // Add reward to trader's deposited tokens for withdrawal
            if (traderReward > 0) {
                depositedTokens[topTraders[i].trader][rewardToken] += traderReward;
            }
        }

        // Handle remainder by giving it to the top trader (highest volume)
        if (distributedTotal < totalAmount && topTraders.length > 0) {
            uint256 remainder = totalAmount - distributedTotal;
            rewards[0] += remainder;
            depositedTokens[topTraders[0].trader][rewardToken] += remainder;
        }

        emit VolumeIncentivesDistributedWeighted(battleId, traderAddresses, volumes, rewards);
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
        ICreatorCoin creatorCoin = ICreatorCoin(coinAddress);

        // Verify the creator is the payout recipient of this coin
        require(creatorCoin.payoutRecipient() == creator, "Creator not coin owner");

        // Check that the creator has claimable vested amount (indicates active coin)
        // [uv1000] let's here instead ensure that they've inputted 500$ worth of their creator coin
        uint256 claimableAmount = creatorCoin.getClaimableAmount();
        require(claimableAmount > 0, "No claimable vested tokens");

        // Calculate required stake (10% of claimable amount)
        requiredStake = (claimableAmount * 10) / 100;

        // Note: We no longer check creator's direct balance since we're using deposited tokens
        // The deposited token balance check is done in startContest

        return requiredStake;
    }

    /// @notice Update top traders list with new volume using efficient insert sort
    /// @param battleId The battle identifier
    /// @param trader The trader address
    /// @param newVolume The trader's new total volume
    function _updateTopTraders(bytes32 battleId, address trader, uint256 newVolume) internal {
        TopTrader[] storage topTraders = battleTopTradersSorted[battleId];

        // Find if trader already exists in the list
        bool traderExists = false;
        uint256 existingIndex = 0;

        for (uint256 i = 0; i < topTraders.length; i++) {
            if (topTraders[i].trader == trader) {
                traderExists = true;
                existingIndex = i;
                break;
            }
        }

        // If trader exists, update their volume and re-sort
        if (traderExists) {
            topTraders[existingIndex].volume = newVolume;

            // Bubble up if volume increased
            uint256 currentIndex = existingIndex;
            while (currentIndex > 0 && topTraders[currentIndex].volume > topTraders[currentIndex - 1].volume) {
                // Swap with higher position
                TopTrader memory temp = topTraders[currentIndex];
                topTraders[currentIndex] = topTraders[currentIndex - 1];
                topTraders[currentIndex - 1] = temp;
                currentIndex--;
            }

            // Bubble down if volume decreased
            currentIndex = existingIndex;
            while (
                currentIndex < topTraders.length - 1
                    && topTraders[currentIndex].volume < topTraders[currentIndex + 1].volume
            ) {
                // Swap with lower position
                TopTrader memory temp = topTraders[currentIndex];
                topTraders[currentIndex] = topTraders[currentIndex + 1];
                topTraders[currentIndex + 1] = temp;
                currentIndex++;
            }
        } else {
            // New trader - insert in correct position or add if list not full
            if (topTraders.length < MAX_TOP_TRADERS) {
                // Add new trader to the end and bubble up
                topTraders.push(TopTrader({trader: trader, volume: newVolume}));

                uint256 currentIndex = topTraders.length - 1;
                while (currentIndex > 0 && topTraders[currentIndex].volume > topTraders[currentIndex - 1].volume) {
                    // Swap with higher position
                    TopTrader memory temp = topTraders[currentIndex];
                    topTraders[currentIndex] = topTraders[currentIndex - 1];
                    topTraders[currentIndex - 1] = temp;
                    currentIndex--;
                }
            } else {
                // List is full - only insert if volume is higher than lowest
                uint256 lowestIndex = topTraders.length - 1;
                if (newVolume > topTraders[lowestIndex].volume) {
                    // Replace lowest trader and bubble up
                    topTraders[lowestIndex] = TopTrader({trader: trader, volume: newVolume});

                    uint256 currentIndex = lowestIndex;
                    while (currentIndex > 0 && topTraders[currentIndex].volume > topTraders[currentIndex - 1].volume) {
                        // Swap with higher position
                        TopTrader memory temp = topTraders[currentIndex];
                        topTraders[currentIndex] = topTraders[currentIndex - 1];
                        topTraders[currentIndex - 1] = temp;
                        currentIndex--;
                    }
                }
            }
        }

        // Find trader's new rank for event emission
        uint256 rank = 0;
        for (uint256 i = 0; i < topTraders.length; i++) {
            if (topTraders[i].trader == trader) {
                rank = i + 1; // 1-based rank
                break;
            }
        }

        if (rank > 0) {
            emit TopTraderUpdated(battleId, trader, newVolume, rank);
        }
    }

    /// @notice Distribute tokens to collectors using gas-optimized batch processing
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

        // Use optimized batch processing for large collector arrays
        if (collectors.length > MAX_COLLECTORS_PER_BATCH) {
            _distributeToCollectorsBatch(collectors, balances, totalAmount, tokenAddress);
        } else {
            _distributeToCollectorsOptimized(collectors, balances, totalAmount, tokenAddress);
        }
    }

    /// @notice Gas-optimized collector distribution for smaller arrays (≤50 collectors)
    /// @param collectors Array of collector addresses
    /// @param balances Array of collector token balances
    /// @param totalAmount Total amount to distribute
    /// @param tokenAddress The token contract to distribute
    function _distributeToCollectorsOptimized(
        address[] calldata collectors,
        uint256[] calldata balances,
        uint256 totalAmount,
        address tokenAddress
    ) internal {
        uint256 length = collectors.length;

        // Single-pass calculation with higher precision
        uint256 totalBalance = 0;
        uint256 validCollectors = 0;

        // Calculate total balance (single pass)
        for (uint256 i = 0; i < length; i++) {
            if (balances[i] > 0) {
                totalBalance += balances[i];
                validCollectors++;
            }
        }

        require(totalBalance > 0, "No collector balances");

        // Calculate rewards with enhanced precision
        CollectorReward[] memory rewards = new CollectorReward[](validCollectors);
        uint256 distributedTotal = 0;
        uint256 rewardIndex = 0;

        // Single-pass reward calculation with precision handling
        for (uint256 i = 0; i < length; i++) {
            if (balances[i] > 0) {
                // Use higher precision arithmetic to minimize truncation
                uint256 preciseReward =
                    (totalAmount * balances[i] * PRECISION_MULTIPLIER) / (totalBalance * PRECISION_MULTIPLIER);

                // Apply minimum threshold to avoid dust
                if (preciseReward >= MIN_COLLECTOR_REWARD) {
                    rewards[rewardIndex] = CollectorReward({
                        collector: collectors[i],
                        balance: balances[i],
                        rewardAmount: preciseReward,
                        processed: false
                    });
                    distributedTotal += preciseReward;
                    rewardIndex++;
                }
            }
        }

        // Enhanced remainder handling - distribute proportionally
        uint256 remainder = totalAmount - distributedTotal;
        if (remainder > 0 && rewardIndex > 0) {
            remainder = _distributeRemainderProportionally(rewards, rewardIndex, remainder, totalBalance);
        }

        // Batch update storage (single storage write per collector)
        for (uint256 i = 0; i < rewardIndex; i++) {
            if (rewards[i].rewardAmount > 0) {
                depositedTokens[rewards[i].collector][tokenAddress] += rewards[i].rewardAmount;
            }
        }

        emit CollectorDistributionCompleted(
            keccak256(abi.encodePacked(block.timestamp, collectors.length)), rewardIndex, totalAmount, remainder
        );
    }

    /// @notice Batch processing for large collector arrays (>50 collectors)
    /// @param collectors Array of collector addresses
    /// @param balances Array of collector token balances
    /// @param totalAmount Total amount to distribute
    /// @param tokenAddress The token contract to distribute
    function _distributeToCollectorsBatch(
        address[] calldata collectors,
        uint256[] calldata balances,
        uint256 totalAmount,
        address tokenAddress
    ) internal {
        uint256 length = collectors.length;

        // Calculate total balance across all collectors
        uint256 totalBalance = 0;
        for (uint256 i = 0; i < length; i++) {
            if (balances[i] > 0) {
                totalBalance += balances[i];
            }
        }

        require(totalBalance > 0, "No collector balances");

        // Process in batches to manage gas costs
        uint256 totalDistributed = 0;
        uint256 batchIndex = 0;

        for (uint256 startIndex = 0; startIndex < length; startIndex += MAX_COLLECTORS_PER_BATCH) {
            uint256 endIndex = startIndex + MAX_COLLECTORS_PER_BATCH;
            if (endIndex > length) {
                endIndex = length;
            }

            uint256 batchDistributed =
                _processBatch(collectors, balances, startIndex, endIndex, totalAmount, totalBalance, tokenAddress);

            totalDistributed += batchDistributed;

            emit CollectorBatchProcessed(
                keccak256(abi.encodePacked(block.timestamp, collectors.length)),
                batchIndex,
                endIndex - startIndex,
                batchDistributed
            );

            batchIndex++;
        }

        // Handle any final remainder
        uint256 finalRemainder = totalAmount - totalDistributed;
        if (finalRemainder > 0) {
            // Give final remainder to first collector with non-zero balance
            for (uint256 i = 0; i < length; i++) {
                if (balances[i] > 0) {
                    depositedTokens[collectors[i]][tokenAddress] += finalRemainder;
                    break;
                }
            }
        }

        emit CollectorDistributionCompleted(
            keccak256(abi.encodePacked(block.timestamp, collectors.length)), length, totalAmount, finalRemainder
        );
    }

    /// @notice Process a batch of collectors within gas limits
    /// @param collectors Full collector array
    /// @param balances Full balance array
    /// @param startIndex Start index for this batch
    /// @param endIndex End index for this batch
    /// @param totalAmount Total amount being distributed
    /// @param totalBalance Total balance across all collectors
    /// @param tokenAddress Token to distribute
    /// @return batchDistributed Amount distributed in this batch
    function _processBatch(
        address[] calldata collectors,
        uint256[] calldata balances,
        uint256 startIndex,
        uint256 endIndex,
        uint256 totalAmount,
        uint256 totalBalance,
        address tokenAddress
    ) internal returns (uint256 batchDistributed) {
        for (uint256 i = startIndex; i < endIndex; i++) {
            if (balances[i] > 0) {
                uint256 collectorShare = (totalAmount * balances[i]) / totalBalance;
                if (collectorShare >= MIN_COLLECTOR_REWARD) {
                    depositedTokens[collectors[i]][tokenAddress] += collectorShare;
                    batchDistributed += collectorShare;
                }
            }
        }

        return batchDistributed;
    }

    /// @notice Distribute remainder proportionally among collectors to maximize fairness
    /// @param rewards Array of collector rewards
    /// @param rewardCount Number of valid rewards
    /// @param remainder Remainder amount to distribute
    /// @param totalBalance Total balance for proportional calculation
    /// @return remainingRemainder Any remainder that couldn't be distributed
    function _distributeRemainderProportionally(
        CollectorReward[] memory rewards,
        uint256 rewardCount,
        uint256 remainder,
        uint256 totalBalance
    ) internal pure returns (uint256 remainingRemainder) {
        if (remainder == 0 || rewardCount == 0) {
            return remainder;
        }

        // Distribute remainder proportionally based on balance
        uint256 distributedRemainder = 0;

        for (uint256 i = 0; i < rewardCount && distributedRemainder < remainder; i++) {
            // Calculate proportional share of remainder
            uint256 remainderShare = (remainder * rewards[i].balance) / totalBalance;

            if (remainderShare > 0 && distributedRemainder + remainderShare <= remainder) {
                rewards[i].rewardAmount += remainderShare;
                distributedRemainder += remainderShare;
            }
        }

        // Return any amount that couldn't be distributed
        return remainder - distributedRemainder;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // ADMIN & EMERGENCY FUNCTIONS
    // ══════════════════════════════════════════════════════════════════════════════

    /// @notice Emergency pause all contract operations
    /// @param reason Reason for the pause (for transparency)
    function emergencyPause(string calldata reason) external onlyRole(EMERGENCY_ROLE) {
        _pause();
        emit EmergencyPause(msg.sender, reason);
    }

    /// @notice Unpause contract operations
    function emergencyUnpause() external onlyRole(EMERGENCY_ROLE) {
        _unpause();
        emit EmergencyUnpause(msg.sender);
    }

    /// @notice Set treasury address for protocol fee collection
    /// @param newTreasury New treasury address
    function setTreasuryAddress(address newTreasury) external onlyRole(TREASURY_ROLE) {
        require(newTreasury != address(0), "Invalid treasury address");

        address oldTreasury = treasuryAddress;
        treasuryAddress = newTreasury;

        emit TreasuryAddressUpdated(oldTreasury, newTreasury);
    }

    /// @notice Withdraw accumulated treasury funds
    /// @param tokenAddress Token to withdraw from treasury
    /// @param amount Amount to withdraw (0 = withdraw all)
    function withdrawTreasury(address tokenAddress, uint256 amount) external onlyRole(TREASURY_ROLE) {
        require(tokenAddress != address(0), "Invalid token address");
        require(treasuryAddress != address(0), "Treasury address not set");

        uint256 availableBalance = treasuryBalances[tokenAddress];
        require(availableBalance > 0, "No treasury balance for token");

        if (amount == 0 || amount > availableBalance) {
            amount = availableBalance;
        }

        treasuryBalances[tokenAddress] -= amount;
        IERC20(tokenAddress).safeTransfer(treasuryAddress, amount);

        emit TreasuryWithdrawal(treasuryAddress, tokenAddress, amount);
    }

    /// @notice Get treasury balance for a specific token
    /// @param tokenAddress Token to check balance for
    /// @return balance Treasury balance for the token
    function getTreasuryBalance(address tokenAddress) external view returns (uint256 balance) {
        return treasuryBalances[tokenAddress];
    }

    /// @notice Get multiple battle information in a single call (gas-optimized for UIs)
    /// @param battleIds Array of battle IDs to retrieve
    /// @return battlesArray Array of battle structs
    function getBattlesBatch(bytes32[] calldata battleIds) external view returns (Battle[] memory battlesArray) {
        battlesArray = new Battle[](battleIds.length);

        for (uint256 i = 0; i < battleIds.length; i++) {
            battlesArray[i] = battles[battleIds[i]];
        }

        return battlesArray;
    }

    /// @notice Get all active battles for a creator
    /// @param creator Creator address
    /// @param otherCreators Array of other creators to check battles with
    /// @return activeBattleIds Array of active battle IDs
    function getActiveBattlesForCreator(address creator, address[] calldata otherCreators)
        external
        view
        returns (bytes32[] memory activeBattleIds)
    {
        uint256 activeCount = 0;
        bytes32[] memory tempBattles = new bytes32[](otherCreators.length);

        // Count active battles first
        for (uint256 i = 0; i < otherCreators.length; i++) {
            bytes32 battleId = activeBattles[creator][otherCreators[i]];
            if (battleId != 0) {
                tempBattles[activeCount] = battleId;
                activeCount++;
            }
        }

        // Create correctly-sized return array
        activeBattleIds = new bytes32[](activeCount);
        for (uint256 i = 0; i < activeCount; i++) {
            activeBattleIds[i] = tempBattles[i];
        }

        return activeBattleIds;
    }

    /// @notice Get comprehensive battle summary (gas-optimized for dashboards)
    /// @param battleId Battle ID to get summary for
    /// @return battle Battle struct
    /// @return volumeStats Volume statistics
    /// @return topTraders Top traders array
    /// @return topVolumes Top trader volumes
    function getBattleSummary(bytes32 battleId)
        external
        view
        returns (
            Battle memory battle,
            uint256[4] memory volumeStats, // [totalVolume, topTraderCount, averageTopTraderVolume, topTraderVolume]
            address[] memory topTraders,
            uint256[] memory topVolumes
        )
    {
        battle = battles[battleId];

        (volumeStats[0], volumeStats[1], volumeStats[2], volumeStats[3]) = this.getBattleVolumeStats(battleId);
        (topTraders, topVolumes) = this.getBattleTopTraders(battleId);

        return (battle, volumeStats, topTraders, topVolumes);
    }

    /// @notice Check if an address has a specific role (utility function)
    /// @param role Role to check
    /// @param account Address to check
    /// @return hasRoleResult Whether the address has the role
    function checkRole(bytes32 role, address account) external view returns (bool hasRoleResult) {
        return hasRole(role, account);
    }

    /// @notice Grant multiple roles to an address (utility function)
    /// @param account Address to grant roles to
    /// @param roles Array of roles to grant
    function grantRolesBatch(address account, bytes32[] calldata roles) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(account != address(0), "Invalid account address");

        for (uint256 i = 0; i < roles.length; i++) {
            grantRole(roles[i], account);
        }
    }

    /// @notice Revoke multiple roles from an address (utility function)
    /// @param account Address to revoke roles from
    /// @param roles Array of roles to revoke
    function revokeRolesBatch(address account, bytes32[] calldata roles) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(account != address(0), "Invalid account address");

        for (uint256 i = 0; i < roles.length; i++) {
            revokeRole(roles[i], account);
        }
    }

    /// @notice Emergency function to cancel an active battle (extreme circumstances only)
    /// @param battleId Battle to cancel
    function emergencyCancelBattle(bytes32 battleId) external onlyRole(CONTEST_MODERATOR_ROLE) {
        Battle storage battle = battles[battleId];
        require(battle.startTime > 0, "Battle does not exist");
        require(battle.state == BattleState.CHALLENGE_PERIOD, "Battle not active");

        // Unlock tokens back to creators
        lockedTokens[battle.playerOne][battle.playerOneCoin] -= battle.playerOneStake;
        depositedTokens[battle.playerOne][battle.playerOneCoin] += battle.playerOneStake;

        lockedTokens[battle.playerTwo][battle.playerTwoCoin] -= battle.playerTwoStake;
        depositedTokens[battle.playerTwo][battle.playerTwoCoin] += battle.playerTwoStake;

        // Update battle state
        battle.state = BattleState.CANCELLED;

        // Clear active battle tracking
        activeBattles[battle.playerOne][battle.playerTwo] = 0;
        activeBattles[battle.playerTwo][battle.playerOne] = 0;

        emit BattleCompleted(battleId, address(0)); // address(0) indicates cancellation
    }
}
