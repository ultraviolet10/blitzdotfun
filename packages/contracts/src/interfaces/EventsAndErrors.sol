// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

// ══════════════════════════════════════════════════════════════════════════════
// CUSTOM ERRORS
// ══════════════════════════════════════════════════════════════════════════════

error InvalidAddress();
error InsufficientBalance();
error BattleNotFound();
error BattleAlreadyExists();
error BattleNotActive();
error ContestStillOngoing();
error InvalidCollectorArrays();
error TieScoresNotAllowed();
error NoVestingSchedule();
error NothingToClaim();
error StillInCooldown();
error TimelockAlreadyExists();
error VestingScheduleAlreadyExists();

// ══════════════════════════════════════════════════════════════════════════════
// CUSTOM EVENTS
// ══════════════════════════════════════════════════════════════════════════════
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

event VolumeTracked(bytes32 indexed battleId, address indexed trader, uint256 volume, uint256 timestamp);

event TopTraderUpdated(bytes32 indexed battleId, address indexed trader, uint256 newVolume, uint256 rank);

event VolumeIncentivesDistributedWeighted(
    bytes32 indexed battleId, address[] traders, uint256[] volumes, uint256[] rewards
);

// Step 9: Enhanced collector distribution events
event CollectorBatchProcessed(
    bytes32 indexed battleId, uint256 batchIndex, uint256 collectorsProcessed, uint256 totalDistributed
);

event CollectorDistributionCompleted(
    bytes32 indexed battleId, uint256 totalCollectors, uint256 totalAmount, uint256 remainderDistributed
);

// Step 10: Admin and emergency events
event TreasuryAddressUpdated(address indexed oldTreasury, address indexed newTreasury);

event TreasuryWithdrawal(address indexed treasury, address indexed token, uint256 amount);

event EmergencyPause(address indexed admin, string reason);

event EmergencyUnpause(address indexed admin);
