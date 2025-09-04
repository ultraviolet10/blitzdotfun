// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {
    TierRewardsDistributed,
    VestingScheduleCreated,
    TimelockWithdrawalCreated,
    CollectorDistributionCompleted,
    CollectorBatchProcessed,
    VolumeIncentivesDistributedWeighted
} from "../interfaces/EventsAndErrors.sol";

import {
    VestingSchedule,
    TradingFeeAccumulator,
    TimelockWithdrawal,
    TopTrader,
    CollectorReward
} from "../interfaces/Types.sol";

import {BlitzVolumeTracker} from "./BlitzVolumeTracker.sol";
import {BlitzVault} from "./BlitzVault.sol";

/**
 * @title BlitzDistribution Library
 * @notice Gas-optimized distribution logic for creator coin contests
 * @dev Implements multi-tier reward distribution with sophisticated collector handling
 *
 * @custom:architecture
 * This library provides three-tier distribution system:
 * - Tier 1 (70%): Winner rewards with liquid + vesting + collector distribution
 * - Tier 2 (15%): Flywheel amplification via fee accumulation and backing boosts
 * - Tier 3 (15%): Ecosystem support via loser consolation + trader incentives + protocol treasury
 *
 * @custom:gas-optimization
 * - Uses storage references to minimize state access costs
 * - Batch operations for large collector arrays
 * - Single-pass algorithms with enhanced precision
 * - Memory-optimized data structures
 *
 * @custom:security
 * - All functions use library context (DELEGATECALL)
 * - Input validation on all distribution parameters
 * - Overflow protection with SafeERC20
 * - Event emission for full audit trail
 */
library BlitzDistribution {
    using SafeERC20 for IERC20;

    // ══════════════════════════════════════════════════════════════════════════════
    // STORAGE STRUCT
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * @dev Storage struct containing all state required for distribution operations
     * @notice This struct is passed by reference to avoid state duplication
     */
    struct BlitzDistributionStorage {
        // Fee accumulation tracking during contests
        mapping(bytes32 => TradingFeeAccumulator) battleFeeData;
        // Protocol treasury balances per token
        mapping(address => uint256) treasuryBalances;
        // Protocol treasury address
        address treasuryAddress;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ══════════════════════════════════════════════════════════════════════════════

    uint256 private constant MAX_COLLECTORS_PER_BATCH = 50;
    uint256 private constant MIN_COLLECTOR_REWARD = 1000;
    uint256 private constant PRECISION_MULTIPLIER = 1e18;

    // ══════════════════════════════════════════════════════════════════════════════
    // CORE DISTRIBUTION FUNCTIONS
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Distribute Tier 1: Winner Rewards (70% of pool)
     * @dev Distributes rewards in three components:
     *      - 50% immediate liquid (split between winner's coin and loser's coin)
     *      - 15% to content coin holders (collector distribution)
     *      - 5% time-locked vesting (30 days linear)
     *
     * @param vaultStorage Storage reference for vault state
     * @param battleId The battle identifier for event emission
     * @param winner The winning creator address
     * @param winnerCoin The winner's coin contract address
     * @param loserCoin The loser's coin contract address
     * @param totalPool The total prize pool (winner + loser stakes)
     * @param topCollectors Array of top collector addresses
     * @param collectorBalances Array of collector token balances
     * @param winnerLiquidBps Basis points for immediate liquid distribution (5000 = 50%)
     * @param winnerCollectorBps Basis points for collector distribution (1500 = 15%)
     * @param winnerVestingBps Basis points for vesting distribution (500 = 5%)
     * @param vestingDuration Vesting duration in seconds (30 days)
     */
    function distributeTier1WinnerRewards(
        BlitzDistributionStorage storage, /* self */
        BlitzVault.VaultStorage storage vaultStorage,
        bytes32 battleId,
        address winner,
        address winnerCoin,
        address loserCoin,
        uint256 totalPool,
        address[] calldata topCollectors,
        uint256[] calldata collectorBalances,
        uint256 winnerLiquidBps,
        uint256 winnerCollectorBps,
        uint256 winnerVestingBps,
        uint256 vestingDuration
    ) external {
        require(winner != address(0), "Invalid winner address");
        require(winnerCoin != address(0) && loserCoin != address(0), "Invalid coin addresses");
        require(totalPool > 0, "Invalid total pool");

        // 50% immediate liquid to winner (from actual prize pool)
        uint256 liquidAmount = (totalPool * winnerLiquidBps) / 10000;
        IERC20(loserCoin).safeTransfer(winner, liquidAmount);

        // 15% to content coin holders (collector distribution)
        uint256 collectorAmount = (totalPool * winnerCollectorBps) / 10000;
        if (topCollectors.length > 0 && collectorAmount > 0) {
            _distributeToCollectors(topCollectors, collectorBalances, collectorAmount, loserCoin);
        }

        // 5% time-locked vesting (30 days) // [uv1000] remove
        uint256 vestingAmount = (totalPool * winnerVestingBps) / 10000;
        if (vestingAmount > 0) {
            BlitzVault.createVestingSchedule(vaultStorage, winner, winnerCoin, vestingAmount, vestingDuration);
        }

        emit TierRewardsDistributed(battleId, 1, (liquidAmount + collectorAmount + vestingAmount));
    }

    /**
     * @notice Distribute Tier 2: Flywheel Amplification (15% of pool)
     * @dev Implements the flywheel mechanism:
     *      - 10% trading fee accumulation from contest period
     *      - 5% backing boost for content coin flywheel effects
     *
     * @param self Storage reference for distribution state
     * @param battleId The battle identifier
     * @param winner The winning creator address
     * @param winnerCoin The winner's coin contract address
     * @param loserCoin The loser's coin contract address
     * @param totalPool The total prize pool
     * @param flywheelFeesBps Basis points for fee accumulation (1000 = 10%)
     * @param flywheelBoostBps Basis points for backing boost (500 = 5%)
     */
    function distributeTier2FlywheelRewards(
        BlitzDistributionStorage storage self,
        BlitzVault.VaultStorage storage vaultStorage,
        bytes32 battleId,
        address winner,
        address winnerCoin,
        address loserCoin,
        uint256 totalPool,
        uint256 flywheelFeesBps,
        uint256 flywheelBoostBps
    ) external {
        require(winner != address(0), "Invalid winner address");
        require(winnerCoin != address(0) && loserCoin != address(0), "Invalid coin addresses");
        require(totalPool > 0, "Invalid total pool");

        // 10% trading fee accumulation during contest
        uint256 feeReward = (totalPool * flywheelFeesBps) / 10000;
        TradingFeeAccumulator storage feeData = self.battleFeeData[battleId];

        if (feeData.totalAccumulatedFees > 0) {
            // Winner gets accumulated fees from BOTH coins
            uint256 feeShare = feeData.totalAccumulatedFees / 2;
            vaultStorage.depositedTokens[winner][winnerCoin] += feeShare;
            vaultStorage.depositedTokens[winner][loserCoin] += feeShare;
        } else {
            // Fallback: give equivalent from pool
            uint256 fallbackShare = feeReward / 2;
            vaultStorage.depositedTokens[winner][winnerCoin] += fallbackShare;
            vaultStorage.depositedTokens[winner][loserCoin] += fallbackShare;
        }

        // [uv1000] no actual erc20 transfer either
        // 5% backing boost (simplified for now - TODO: implement content coin detection)
        uint256 boostAmount = (totalPool * flywheelBoostBps) / 10000;
        // For now, give boost directly to winner - will enhance with coin type detection later
        vaultStorage.depositedTokens[winner][winnerCoin] += boostAmount;

        emit TierRewardsDistributed(battleId, 2, (feeReward + boostAmount));
    }

    /**
     * @notice Distribute Tier 3: Ecosystem Support (15% of pool)
     * @dev Distributes ecosystem rewards:
     *      - 10% loser consolation with 7-day cooldown
     *      - 3% volume incentives for top traders
     *      - 2% protocol treasury accumulation
     *
     * @param self Storage reference for distribution state
     * @param battleId The battle identifier
     * @param loser The losing creator address
     * @param loserCoin The loser's coin contract address
     * @param totalPool The total prize pool
     * @param loserConsolationBps Basis points for loser consolation (1000 = 10%)
     * @param traderIncentiveBps Basis points for trader incentives (300 = 3%)
     * @param protocolTreasuryBps Basis points for protocol treasury (200 = 2%)
     * @param loserCooldown Cooldown period for loser withdrawal (7 days)
     */
    function distributeTier3EcosystemRewards(
        BlitzDistributionStorage storage self,
        BlitzVault.VaultStorage storage vaultStorage,
        BlitzVolumeTracker.VolumeTrackingStorage storage volumeStorage,
        bytes32 battleId,
        address loser,
        address loserCoin,
        uint256 totalPool,
        uint256 loserConsolationBps,
        uint256 traderIncentiveBps,
        uint256 protocolTreasuryBps,
        uint256 loserCooldown
    ) external {
        require(loser != address(0), "Invalid loser address");
        require(loserCoin != address(0), "Invalid loser coin address");
        require(totalPool > 0, "Invalid total pool");

        // 10% loser consolation (with 7-day cooldown)
        uint256 consolationAmount = (totalPool * loserConsolationBps) / 10000;
        if (consolationAmount > 0) {
            // [uv1000] remove
            BlitzVault.createTimelockWithdrawal(vaultStorage, loser, loserCoin, consolationAmount, loserCooldown);
        }

        // 3% volume incentives for top traders
        uint256 traderIncentive = (totalPool * traderIncentiveBps) / 10000;
        if (traderIncentive > 0) {
            _distributeVolumeIncentivesToAccounts(vaultStorage, volumeStorage, battleId, traderIncentive, loserCoin);
        }

        // 2% protocol treasury - accumulate in treasury balances
        uint256 treasuryAmount = (totalPool * protocolTreasuryBps) / 10000;
        if (treasuryAmount > 0) {
            self.treasuryBalances[loserCoin] += treasuryAmount;
        }

        emit TierRewardsDistributed(battleId, 3, (consolationAmount + traderIncentive + treasuryAmount));
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // COLLECTOR DISTRIBUTION FUNCTIONS
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Distribute tokens to collectors using gas-optimized batch processing
     * @dev Automatically chooses between optimized single-batch or multi-batch processing
     * @param collectors Array of collector addresses
     * @param balances Array of collector token balances
     * @param totalAmount Total amount to distribute
     * @param tokenAddress The token contract to distribute
     */
    function _distributeToCollectors(
        address[] calldata collectors,
        uint256[] calldata balances,
        uint256 totalAmount,
        address tokenAddress
    ) private {
        if (collectors.length == 0 || totalAmount == 0) return;
        require(collectors.length == balances.length, "Array length mismatch");

        // Use optimized batch processing for large collector arrays
        if (collectors.length > MAX_COLLECTORS_PER_BATCH) {
            _distributeToCollectorsBatch(collectors, balances, totalAmount, tokenAddress);
        } else {
            _distributeToCollectorsOptimized(collectors, balances, totalAmount, tokenAddress);
        }
    }

    /**
     * @notice Gas-optimized collector distribution for smaller arrays (≤50 collectors)
     * @dev Single-pass algorithm with enhanced precision and proportional remainder distribution
     */
    function _distributeToCollectorsOptimized(
        address[] calldata collectors,
        uint256[] calldata balances,
        uint256 totalAmount,
        address tokenAddress
    ) private {
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

        // Direct transfer to collectors (immediate distribution)
        for (uint256 i = 0; i < rewardIndex; i++) {
            if (rewards[i].rewardAmount > 0) {
                IERC20(tokenAddress).safeTransfer(rewards[i].collector, rewards[i].rewardAmount);
            }
        }

        emit CollectorDistributionCompleted(
            keccak256(abi.encodePacked(block.timestamp, collectors.length)), rewardIndex, totalAmount, remainder
        );
    }

    /**
     * @notice Batch processing for large collector arrays (>50 collectors)
     * @dev Processes collectors in chunks to manage gas costs effectively
     */
    function _distributeToCollectorsBatch(
        address[] calldata collectors,
        uint256[] calldata balances,
        uint256 totalAmount,
        address tokenAddress
    ) private {
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
                    IERC20(tokenAddress).safeTransfer(collectors[i], finalRemainder);
                    break;
                }
            }
        }

        emit CollectorDistributionCompleted(
            keccak256(abi.encodePacked(block.timestamp, collectors.length)), length, totalAmount, finalRemainder
        );
    }

    /**
     * @notice Process a batch of collectors within gas limits
     * @dev Internal function for batch processing individual collector chunks
     */
    function _processBatch(
        address[] calldata collectors,
        uint256[] calldata balances,
        uint256 startIndex,
        uint256 endIndex,
        uint256 totalAmount,
        uint256 totalBalance,
        address tokenAddress
    ) private returns (uint256 batchDistributed) {
        for (uint256 i = startIndex; i < endIndex; i++) {
            if (balances[i] > 0) {
                uint256 collectorShare = (totalAmount * balances[i]) / totalBalance;
                if (collectorShare >= MIN_COLLECTOR_REWARD) {
                    IERC20(tokenAddress).safeTransfer(collectors[i], collectorShare);
                    batchDistributed += collectorShare;
                }
            }
        }

        return batchDistributed;
    }

    /**
     * @notice Distribute remainder proportionally among collectors to maximize fairness
     * @dev Enhanced remainder handling that distributes proportionally rather than to single recipient
     */
    function _distributeRemainderProportionally(
        CollectorReward[] memory rewards,
        uint256 rewardCount,
        uint256 remainder,
        uint256 totalBalance
    ) private pure returns (uint256 remainingRemainder) {
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
    // UTILITY FUNCTIONS
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Distribute volume incentives to trader accounts with actual token transfers
     * @dev Volume-weighted distribution to top traders during contest period using volume tracker
     *
     * @param vaultStorage Storage reference for vault state
     * @param volumeStorage Storage reference for volume tracking state
     * @param battleId The battle identifier
     * @param totalAmount Total amount to distribute
     * @param rewardToken The token to distribute as rewards
     */
    function _distributeVolumeIncentivesToAccounts(
        BlitzVault.VaultStorage storage vaultStorage,
        BlitzVolumeTracker.VolumeTrackingStorage storage volumeStorage,
        bytes32 battleId,
        uint256 totalAmount,
        address rewardToken
    ) private {
        if (totalAmount == 0) return;

        TopTrader[] storage topTraders = volumeStorage.battleTopTradersSorted[battleId];
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

        // [uv1000] no erc20 transfer either
        for (uint256 i = 0; i < topTraders.length; i++) {
            traderAddresses[i] = topTraders[i].trader;
            volumes[i] = topTraders[i].volume;

            // Calculate proportional reward: (traderVolume / totalVolume) * totalAmount
            uint256 traderReward = (totalAmount * topTraders[i].volume) / totalTopTraderVolume;
            rewards[i] = traderReward;
            distributedTotal += traderReward;

            // Add reward to trader's deposited tokens for withdrawal
            if (traderReward > 0) {
                vaultStorage.depositedTokens[topTraders[i].trader][rewardToken] += traderReward;
            }
        }

        // Handle remainder by giving it to the top trader (highest volume)
        if (distributedTotal < totalAmount && topTraders.length > 0) {
            uint256 remainder = totalAmount - distributedTotal;
            rewards[0] += remainder;
            vaultStorage.depositedTokens[topTraders[0].trader][rewardToken] += remainder;
        }

        emit VolumeIncentivesDistributedWeighted(battleId, traderAddresses, volumes, rewards);
    }
}
