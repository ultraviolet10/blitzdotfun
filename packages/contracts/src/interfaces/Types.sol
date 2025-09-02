// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

// ══════════════════════════════════════════════════════════════════════════════
// STRUCTS & ENUMS
// ══════════════════════════════════════════════════════════════════════════════
enum BattleState {
    CHALLENGE_PERIOD, // Creators can stake
    TRADING_PERIOD, // Public trading active
    SCORING_PERIOD, // Calculate winner, no trading
    COMPLETED, // Prizes distributed
    CANCELLED // Emergency state

}

struct Battle {
    bytes32 battleId; // Slot 0: 32 bytes
    address playerOne; // Slot 1: 20 bytes
    uint96 playerOneStake; // Slot 1: 12 bytes (max ~79B tokens, sufficient for most cases)
    address playerTwo; // Slot 2: 20 bytes
    uint96 playerTwoStake; // Slot 2: 12 bytes
    address playerOneCoin; // Slot 3: 20 bytes
    uint96 startTime; // Slot 3: 12 bytes (timestamp until year 2514, sufficient)
    address playerTwoCoin; // Slot 4: 20 bytes
    uint96 endTime; // Slot 4: 12 bytes
    address winner; // Slot 5: 20 bytes
    BattleState state; // Slot 5: 1 byte (enum fits in uint8)
    uint88 reserved; // Slot 5: 11 bytes reserved for future fields
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

struct TraderActivity {
    uint256 totalVolume;
    uint256 lastTradeTime;
    bool isActive;
}

struct TopTrader {
    address trader;
    uint256 volume;
}

// Step 9: Enhanced collector distribution data structures
struct CollectorReward {
    address collector;
    uint256 balance;
    uint256 rewardAmount;
    bool processed;
}
