// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {VolumeTracked, TopTraderUpdated} from "../interfaces/EventsAndErrors.sol";

import {TraderActivity, TopTrader} from "../interfaces/Types.sol";

/**
 * @title BlitzVolumeTracker Library
 * @notice High-precision volume tracking and leaderboard management for creator coin contests
 * @dev Implements sophisticated volume tracking with time-based decay and gas-optimized top trader sorting
 *
 * @custom:architecture
 * This library provides comprehensive volume tracking capabilities:
 * - Real-time volume recording with anti-manipulation decay mechanisms
 * - Gas-optimized top trader leaderboard maintenance with insert sort
 * - Comprehensive statistics and ranking queries
 * - Time-based activity tracking with precision volume calculations
 *
 * @custom:gas-optimization
 * - Insert sort algorithm optimized for small arrays (MAX_TOP_TRADERS = 5)
 * - Single-pass volume decay calculations with early termination
 * - Memory-efficient data structures for trader activity
 * - Batch query operations for UI efficiency
 *
 * @custom:precision-enhancements
 * - Enhanced decay rate calculations with overflow protection
 * - Precise volume aggregation with remainder handling
 * - Time-based decay capping to prevent underflows
 * - Activity state management with precision timestamps
 */
library BlitzVolumeTracker {
    // ══════════════════════════════════════════════════════════════════════════════
    // STORAGE STRUCT
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * @dev Storage struct containing all state required for volume tracking operations
     * @notice This struct is passed by reference to avoid state duplication
     */
    struct VolumeTrackingStorage {
        // Enhanced trader activity tracking: battleId => trader => activity data
        mapping(bytes32 => mapping(address => TraderActivity)) battleTraderActivity;
        // Sorted top traders for efficient distribution: battleId => sorted array
        mapping(bytes32 => TopTrader[]) battleTopTradersSorted;
        // Total contest volume tracking: battleId => total volume
        mapping(bytes32 => uint256) battleTotalVolume;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ══════════════════════════════════════════════════════════════════════════════

    uint256 private constant MAX_TOP_TRADERS = 5; // Gas optimization limit
    uint256 private constant VOLUME_DECAY_RATE = 9500; // 95% retention per hour (prevents early gaming)
    uint256 private constant MIN_TRADE_VOLUME = 1e15; // 0.001 ETH minimum to prevent spam
    uint256 private constant MAX_DECAY_HOURS = 24; // Cap decay calculation to prevent underflows

    // ══════════════════════════════════════════════════════════════════════════════
    // CORE VOLUME TRACKING FUNCTIONS
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Record trading volume for a battle with enhanced precision and decay mechanisms
     * @dev Implements time-based volume decay to prevent early contest gaming
     *
     * @param self Storage reference for volume tracking state
     * @param battleId The battle identifier
     * @param trader The trader address
     * @param volume The trading volume to record
     * @param battleEndTime The battle end time for validation
     */
    function recordTradeVolume(
        VolumeTrackingStorage storage self,
        bytes32 battleId,
        address trader,
        uint256 volume,
        uint256 battleEndTime
    ) external {
        require(block.timestamp <= battleEndTime, "Contest ended");
        require(volume >= MIN_TRADE_VOLUME, "Volume below minimum threshold");
        require(trader != address(0), "Invalid trader address");

        // Get current trader activity
        TraderActivity storage activity = self.battleTraderActivity[battleId][trader];

        // Apply enhanced decay to existing volume if trader was active before
        uint256 decayedVolume = activity.totalVolume;
        if (activity.isActive && activity.lastTradeTime > 0) {
            uint256 hoursElapsed = (block.timestamp - activity.lastTradeTime) / 3600;
            if (hoursElapsed > 0) {
                // Enhanced decay with overflow protection and capped hours
                decayedVolume = _applyVolumeDecay(decayedVolume, hoursElapsed);
            }
        }

        // Update trader activity with precision
        activity.totalVolume = decayedVolume + volume;
        activity.lastTradeTime = block.timestamp;
        activity.isActive = true;

        // Update total contest volume
        self.battleTotalVolume[battleId] += volume;

        // Update top traders list with enhanced sorting
        _updateTopTraders(self, battleId, trader, activity.totalVolume);

        emit VolumeTracked(battleId, trader, volume, block.timestamp);
    }

    /**
     * @notice Apply time-based volume decay with enhanced precision and overflow protection
     * @dev Implements capped decay calculation to prevent underflows and gas issues
     *
     * @param currentVolume The current volume to apply decay to
     * @param hoursElapsed Number of hours elapsed since last trade
     * @return decayedVolume The volume after applying decay
     */
    function _applyVolumeDecay(uint256 currentVolume, uint256 hoursElapsed)
        private
        pure
        returns (uint256 decayedVolume)
    {
        if (currentVolume == 0) return 0;

        // Cap hours elapsed to prevent underflow and excessive gas usage
        uint256 cappedHours = hoursElapsed > MAX_DECAY_HOURS ? MAX_DECAY_HOURS : hoursElapsed;

        decayedVolume = currentVolume;

        // Apply decay: volume * (VOLUME_DECAY_RATE/10000) ^ cappedHours
        // Enhanced precision with overflow protection
        for (uint256 i = 0; i < cappedHours; i++) {
            uint256 newVolume = (decayedVolume * VOLUME_DECAY_RATE) / 10000;

            // Prevent underflow - if volume becomes too small, stop decay
            if (newVolume < MIN_TRADE_VOLUME / 1000) {
                decayedVolume = 0;
                break;
            }

            decayedVolume = newVolume;
        }

        return decayedVolume;
    }

    /**
     * @notice Update top traders list with enhanced insert sort algorithm
     * @dev Gas-optimized sorting with bubble up/down for existing traders and smart insertion for new traders
     *
     * @param self Storage reference for volume tracking state
     * @param battleId The battle identifier
     * @param trader The trader address
     * @param newVolume The trader's new total volume
     */
    function _updateTopTraders(VolumeTrackingStorage storage self, bytes32 battleId, address trader, uint256 newVolume)
        private
    {
        TopTrader[] storage topTraders = self.battleTopTradersSorted[battleId];

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

            // Enhanced bubble up if volume increased
            uint256 currentIndex = existingIndex;
            while (currentIndex > 0 && topTraders[currentIndex].volume > topTraders[currentIndex - 1].volume) {
                // Swap with higher position
                TopTrader memory temp = topTraders[currentIndex];
                topTraders[currentIndex] = topTraders[currentIndex - 1];
                topTraders[currentIndex - 1] = temp;
                currentIndex--;
            }

            // Enhanced bubble down if volume decreased
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
            // New trader - smart insertion logic
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

    // ══════════════════════════════════════════════════════════════════════════════
    // VIEW & QUERY FUNCTIONS
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Get top traders for a battle with their current volumes
     * @dev Returns sorted arrays of traders and their volumes for UI display
     *
     * @param self Storage reference for volume tracking state
     * @param battleId The battle identifier
     * @return traders Array of trader addresses (sorted by volume, descending)
     * @return volumes Array of corresponding volumes
     */
    function getBattleTopTraders(VolumeTrackingStorage storage self, bytes32 battleId)
        external
        view
        returns (address[] memory traders, uint256[] memory volumes)
    {
        TopTrader[] storage topTraders = self.battleTopTradersSorted[battleId];

        traders = new address[](topTraders.length);
        volumes = new uint256[](topTraders.length);

        for (uint256 i = 0; i < topTraders.length; i++) {
            traders[i] = topTraders[i].trader;
            volumes[i] = topTraders[i].volume;
        }

        return (traders, volumes);
    }

    /**
     * @notice Get a specific trader's volume for a battle with real-time decay applied
     * @dev Calculates current volume with time-based decay for accurate real-time display
     *
     * @param self Storage reference for volume tracking state
     * @param battleId The battle identifier
     * @param trader The trader address
     * @return volume The trader's total volume (with decay applied)
     */
    function getTraderVolume(VolumeTrackingStorage storage self, bytes32 battleId, address trader)
        external
        view
        returns (uint256 volume)
    {
        TraderActivity storage activity = self.battleTraderActivity[battleId][trader];

        if (!activity.isActive || activity.totalVolume == 0) {
            return 0;
        }

        // Apply volume decay based on time elapsed
        uint256 currentVolume = activity.totalVolume;
        if (activity.lastTradeTime > 0) {
            uint256 hoursElapsed = (block.timestamp - activity.lastTradeTime) / 3600;
            if (hoursElapsed > 0) {
                // Apply enhanced decay with same logic as recording
                currentVolume = _applyVolumeDecay(currentVolume, hoursElapsed);
            }
        }

        return currentVolume;
    }

    /**
     * @notice Get total volume for a battle
     * @dev Returns cumulative volume across all participants (no decay applied to total)
     *
     * @param self Storage reference for volume tracking state
     * @param battleId The battle identifier
     * @return totalVolume The total volume across all participants
     */
    function getBattleTotalVolume(VolumeTrackingStorage storage self, bytes32 battleId)
        external
        view
        returns (uint256 totalVolume)
    {
        return self.battleTotalVolume[battleId];
    }

    /**
     * @notice Get trader's rank in the top traders list
     * @dev Returns 1-based ranking for UI display, 0 if not in top list
     *
     * @param self Storage reference for volume tracking state
     * @param battleId The battle identifier
     * @param trader The trader address
     * @return rank The trader's rank (1-based), 0 if not in top list
     */
    function getTraderRank(VolumeTrackingStorage storage self, bytes32 battleId, address trader)
        external
        view
        returns (uint256 rank)
    {
        TopTrader[] storage topTraders = self.battleTopTradersSorted[battleId];

        for (uint256 i = 0; i < topTraders.length; i++) {
            if (topTraders[i].trader == trader) {
                return i + 1; // 1-based rank
            }
        }

        return 0; // Not in top list
    }

    /**
     * @notice Get comprehensive battle volume statistics for analytics
     * @dev Single-call function providing complete volume overview for dashboards
     *
     * @param self Storage reference for volume tracking state
     * @param battleId The battle identifier
     * @return totalVolume Total volume across all participants
     * @return topTraderCount Number of tracked top traders
     * @return averageTopTraderVolume Average volume among top traders
     * @return topTraderVolume Volume of the #1 trader
     */
    function getBattleVolumeStats(VolumeTrackingStorage storage self, bytes32 battleId)
        external
        view
        returns (uint256 totalVolume, uint256 topTraderCount, uint256 averageTopTraderVolume, uint256 topTraderVolume)
    {
        totalVolume = self.battleTotalVolume[battleId];

        TopTrader[] storage topTraders = self.battleTopTradersSorted[battleId];
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

    /**
     * @notice Get trader activity details including last trade time and decay-adjusted volume
     * @dev Comprehensive trader information for detailed analytics and UI displays
     *
     * @param self Storage reference for volume tracking state
     * @param battleId The battle identifier
     * @param trader The trader address
     * @return totalVolume Trader's recorded total volume (no decay)
     * @return lastTradeTime Timestamp of last trade
     * @return isActive Whether trader is currently active
     * @return currentVolume Volume with real-time decay applied
     */
    function getTraderActivity(VolumeTrackingStorage storage self, bytes32 battleId, address trader)
        external
        view
        returns (uint256 totalVolume, uint256 lastTradeTime, bool isActive, uint256 currentVolume)
    {
        TraderActivity storage activity = self.battleTraderActivity[battleId][trader];

        totalVolume = activity.totalVolume;
        lastTradeTime = activity.lastTradeTime;
        isActive = activity.isActive;

        // Calculate current volume with decay (reuse existing logic)
        if (!isActive || totalVolume == 0) {
            currentVolume = 0;
        } else if (lastTradeTime > 0) {
            uint256 hoursElapsed = (block.timestamp - lastTradeTime) / 3600;
            if (hoursElapsed > 0) {
                currentVolume = _applyVolumeDecay(totalVolume, hoursElapsed);
            } else {
                currentVolume = totalVolume;
            }
        } else {
            currentVolume = totalVolume;
        }

        return (totalVolume, lastTradeTime, isActive, currentVolume);
    }

    /**
     * @notice Get all top traders data for volume incentive distribution
     * @dev Internal function used by distribution library for volume-weighted rewards
     *
     * @param self Storage reference for volume tracking state
     * @param battleId The battle identifier
     * @return topTraders Storage reference to top traders array
     */
    function getTopTradersForDistribution(VolumeTrackingStorage storage self, bytes32 battleId)
        external
        view
        returns (TopTrader[] storage topTraders)
    {
        return self.battleTopTradersSorted[battleId];
    }
}
