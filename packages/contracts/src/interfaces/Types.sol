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
