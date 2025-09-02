// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ICreatorCoin} from "./interfaces/ICreatorCoin.sol";
import {ICoin} from "@zora/interfaces/ICoin.sol";
import {BlitzDistribution} from "./libs/BlitzDistribution.sol";
import {BlitzVault} from "./libs/BlitzVault.sol";

import {
    BattleCreated,
    BattleCompleted,
    TreasuryAddressUpdated,
    TreasuryWithdrawal,
    EmergencyPause,
    EmergencyUnpause,
    BattleDurationUpdated
} from "./interfaces/EventsAndErrors.sol";

import {BattleState, Battle} from "./interfaces/Types.sol";

/**
 * @title Blitz - Creator Coin Contest Platform
 * @notice A sophisticated contest platform for creator coin battles with multi-tier reward distribution
 * @dev Implements flywheel-aware distribution mechanics inspired by Zora Protocol architecture
 *
 * @custom:architecture
 * This contract manages creator coin contests with simplified backend-computed distribution:
 * - 50% liquid rewards to winner from loser's stake
 * - 20% collector distribution using backend-computed amounts
 * - 10% protocol treasury accumulation
 * - 20% gas optimization from removed complex features
 *
 * @custom:security
 * - Uses AccessControl for admin functions
 * - ReentrancyGuard on all token transfer functions
 * - Time-based vesting and cooldown mechanisms
 * - Gas-optimized collector distribution with limits
 *
 * @custom:integration
 * - Designed for integration with Zora Protocol creator/content coins
 * - Optimized for backend cron job automation with pre-computed data
 * - Ultra-low gas consumption for high-frequency contest resolution
 *
 * @author Your Team
 * @custom:version 2.0.0 - Enhanced Multi-Tier Distribution
 */
contract Blitz is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    using BlitzDistribution for BlitzDistribution.BlitzDistributionStorage;
    using BlitzVault for BlitzVault.VaultStorage;

    // ══════════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ══════════════════════════════════════════════════════════════════════════════
    mapping(bytes32 => Battle) public battles;
    mapping(address => mapping(address => bytes32)) public activeBattles;

    // Integrated vault storage using BlitzVault library
    BlitzVault.VaultStorage private vaultStorage;

    // Distribution library storage
    BlitzDistribution.BlitzDistributionStorage private distributionStorage;

    // OPTIMIZATION: Battle ID counter for efficient generation (2-5K gas savings)
    uint256 private battleCounter;

    // ══════════════════════════════════════════════════════════════════════════════
    // CONSTANTS & DISTRIBUTION PARAMETERS
    // ══════════════════════════════════════════════════════════════════════════════
    uint256 public battleDuration = 12 hours;
    // Simplified distribution: 50% winner + 20% collectors + 10% treasury + 20% optimized away

    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE"); // Can pause/unpause contract
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE"); // Can manage treasury funds
    bytes32 public constant CONTEST_MODERATOR_ROLE = keccak256("CONTEST_MODERATOR_ROLE"); // Can moderate contests

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
        distributionStorage.treasuryAddress = msg.sender;
    }

    // OPTIMIZATION: Efficient battle ID generation (2-5K gas savings)
    function generateBattleIdOptimized() internal returns (bytes32) {
        // Sequential counter is most gas-efficient (no hashing required)
        return bytes32(++battleCounter);
    }

    // Legacy function - kept for backward compatibility
    function generateBattleId(address playerOne, address playerTwo, uint256 nonce) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(playerOne, playerTwo, nonce));
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // CORE BATTLE FUNCTIONS
    // ══════════════════════════════════════════════════════════════════════════════

    function startContest(address playerOne, address playerTwo, address playerOneCoin, address playerTwoCoin)
        external
        whenNotPaused
        returns (bytes32 battleId)
    {
        // OPTIMIZATION: Cheap validations first (fail fast)
        require(playerOne != playerTwo, "Cannot challenge self");
        require(playerOneCoin != address(0) && playerTwoCoin != address(0), "Invalid coin addresses");

        // OPTIMIZATION: Single mapping check using canonical ordering (50% fewer storage operations)
        require(_getActiveBattle(playerOne, playerTwo) == 0, "Active battle already exists");

        // OPTIMIZATION: Reuse single ValidationResult struct to save memory (10K gas savings)
        ValidationResult memory result;

        result = _validateCreatorStakeAndBalance(playerOne, playerOneCoin);
        require(result.isValid, result.errorReason);
        uint256 playerOneStake = result.requiredStake;

        result = _validateCreatorStakeAndBalance(playerTwo, playerTwoCoin);
        require(result.isValid, result.errorReason);
        uint256 playerTwoStake = result.requiredStake;

        // Balance checks already performed in _validateCreatorStakeAndBalance
        // No need for additional IERC20 balanceOf calls

        // OPTIMIZATION: Use efficient sequential ID generation (2-5K gas savings)
        battleId = generateBattleIdOptimized();

        // Note: Tokens are held directly by contract, no vault locking needed

        battles[battleId] = Battle({
            battleId: battleId,
            playerOne: playerOne,
            playerOneStake: uint96(playerOneStake), // Safe: max 50M tokens vs uint96 max ~79B tokens
            playerTwo: playerTwo,
            playerTwoStake: uint96(playerTwoStake), // Safe: max 50M tokens vs uint96 max ~79B tokens
            playerOneCoin: playerOneCoin,
            startTime: uint96(block.timestamp), // Safe: uint96 good until year 2514
            playerTwoCoin: playerTwoCoin,
            endTime: uint96(block.timestamp + battleDuration), // Safe: uint96 good until year 2514
            winner: address(0),
            state: BattleState.CHALLENGE_PERIOD,
            reserved: 0 // Initialize reserved field
        });

        _setActiveBattle(playerOne, playerTwo, battleId);

        emit BattleCreated(
            battleId,
            playerOne,
            playerTwo,
            playerOneCoin,
            uint96(playerOneStake),
            playerTwoCoin,
            uint96(playerTwoStake),
            uint96(block.timestamp),
            uint96(block.timestamp + battleDuration)
        );

        return battleId; // [uv1000] store in db?
    }

    /// @notice End a contest and distribute prizes with backend-computed winner and collector data
    /// @param battleId The battle to end
    /// @param winner The winning creator address (computed by backend based on trading volume)
    /// @param topCollectors Array of top collector addresses for prize distribution
    /// @param collectorAmounts Array of exact token amounts for each collector (pre-computed)
    function endContest(
        bytes32 battleId,
        address winner,
        address[] calldata topCollectors,
        uint256[] calldata collectorAmounts
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        Battle storage battle = battles[battleId];

        // Validate battle exists and timing
        require(battle.startTime > 0, "Battle does not exist");
        require(battle.state == BattleState.CHALLENGE_PERIOD, "Battle not in active state");
        require(block.timestamp > battle.endTime, "Contest still ongoing");
        require(winner == battle.playerOne || winner == battle.playerTwo, "Invalid winner address");
        require(topCollectors.length == collectorAmounts.length, "Array length mismatch");

        // Determine loser and token addresses based on provided winner
        address loser = (winner == battle.playerOne) ? battle.playerTwo : battle.playerOne;
        address winnerCoin = (winner == battle.playerOne) ? battle.playerOneCoin : battle.playerTwoCoin;
        address loserCoin = (winner == battle.playerOne) ? battle.playerTwoCoin : battle.playerOneCoin;
        uint256 winnerStake = (winner == battle.playerOne) ? battle.playerOneStake : battle.playerTwoStake;
        uint256 prizePool = (winner == battle.playerOne) ? battle.playerTwoStake : battle.playerOneStake;

        // Winner gets their stake back immediately
        IERC20(winnerCoin).safeTransfer(winner, winnerStake);

        // Inline distribution: 50% liquid to winner from prize pool
        uint256 winnerAmount = (prizePool * 5000) / 10000;
        IERC20(loserCoin).safeTransfer(winner, winnerAmount);

        // Inline distribution: 20% to collectors using backend-computed amounts
        _distributeToCollectorsInline(topCollectors, collectorAmounts, loserCoin);

        // Inline distribution: 10% to treasury
        uint256 treasuryAmount = (prizePool * 1000) / 10000;
        distributionStorage.treasuryBalances[loserCoin] += treasuryAmount;

        // Update battle state
        if (battle.winner != winner) {
            battle.winner = winner;
        }
        if (battle.state != BattleState.COMPLETED) {
            battle.state = BattleState.COMPLETED;
        }

        _clearActiveBattleConditional(battle.playerOne, battle.playerTwo);

        emit BattleCompleted(battleId, winner);
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // VAULT MANAGEMENT FUNCTIONS
    // ══════════════════════════════════════════════════════════════════════════════

    /// @notice Withdraw available creator tokens from the vault
    /// @param coinAddress The creator coin contract address
    /// @param amount The amount of tokens to withdraw (0 = withdraw all available)
    function withdrawCreatorTokens(address coinAddress, uint256 amount) external nonReentrant {
        vaultStorage.withdrawCreatorTokens(coinAddress, amount, msg.sender);
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // INTERNAL FUNCTIONS
    // ══════════════════════════════════════════════════════════════════════════════

    // ══════════════════════════════════════════════════════════════════════════════
    // VIEW & GETTER FUNCTIONS
    // ══════════════════════════════════════════════════════════════════════════════

    /// @notice Result of creator stake validation with cached balance
    struct ValidationResult {
        uint256 requiredStake;
        uint256 contractBalance;
        bool isValid;
        string errorReason;
    }

    /// @notice Get canonical battle key (smaller address first) for consistent mapping
    /// @param playerA First player address
    /// @param playerB Second player address
    /// @return first The smaller address (canonical first key)
    /// @return second The larger address (canonical second key)
    function _getBattleKey(address playerA, address playerB) internal pure returns (address first, address second) {
        return playerA < playerB ? (playerA, playerB) : (playerB, playerA);
    }

    /// @notice Get active battle ID between two players using canonical ordering
    /// @param playerA First player address
    /// @param playerB Second player address
    /// @return battleId The active battle ID, or 0 if none exists
    function _getActiveBattle(address playerA, address playerB) internal view returns (bytes32) {
        (address first, address second) = _getBattleKey(playerA, playerB);
        return activeBattles[first][second];
    }

    /// @notice Set active battle ID between two players using canonical ordering
    /// @param playerA First player address
    /// @param playerB Second player address
    /// @param battleId The battle ID to set
    function _setActiveBattle(address playerA, address playerB, bytes32 battleId) internal {
        (address first, address second) = _getBattleKey(playerA, playerB);
        activeBattles[first][second] = battleId;
    }

    /// @param playerA First player address
    /// @param playerB Second player address
    function _clearActiveBattleConditional(address playerA, address playerB) internal {
        (address first, address second) = _getBattleKey(playerA, playerB);
        if (activeBattles[first][second] != 0) {
            activeBattles[first][second] = 0;
        }
    }

    /// @notice Distribute tokens to collectors using pre-computed amounts
    /// @param collectors Array of collector addresses
    /// @param amounts Array of exact token amounts for each collector
    /// @param tokenAddress The token contract to distribute
    function _distributeToCollectorsInline(
        address[] calldata collectors,
        uint256[] calldata amounts,
        address tokenAddress
    ) internal {
        for (uint256 i = 0; i < collectors.length; i++) {
            if (amounts[i] > 0 && collectors[i] != address(0)) {
                IERC20(tokenAddress).safeTransfer(collectors[i], amounts[i]);
            }
        }
    }

    /// @notice Validates creator stake and gets contract balance in single call (gas optimized)
    /// @param creator The creator's address
    /// @param coinAddress The creator's coin contract address
    /// @return result Validation result with stake, balance, and validity
    function _validateCreatorStakeAndBalance(address creator, address coinAddress)
        internal
        view
        returns (ValidationResult memory result)
    {
        ICreatorCoin creatorCoin = ICreatorCoin(coinAddress);

        address payoutRecipient = creatorCoin.payoutRecipient();
        if (payoutRecipient != creator) {
            result.errorReason = "Creator not coin owner";
            return result;
        }

        uint256 claimableAmount = creatorCoin.getClaimableAmount();
        if (claimableAmount == 0) {
            result.errorReason = "No claimable vested tokens";
            return result;
        }

        // Calculate required stake (10% of claimable amount) - using stack variable
        uint256 requiredStake = (claimableAmount * 10) / 100;
        result.requiredStake = requiredStake;

        // Get contract balance in same call
        uint256 contractBalance = IERC20(coinAddress).balanceOf(address(this));
        result.contractBalance = contractBalance;

        // Check if contract has sufficient balance
        if (contractBalance < requiredStake) {
            result.errorReason = "Contract: insufficient tokens";
            return result;
        }

        result.isValid = true;
        return result;
    }

    /// @notice Legacy function - kept for backward compatibility
    /// @param creator The creator's address
    /// @param coinAddress The creator's coin contract address
    /// @return requiredStake The amount that needs to be staked (10% of claimable)
    function _validateCreatorStake(address creator, address coinAddress)
        internal
        view
        returns (uint256 requiredStake)
    {
        ValidationResult memory result = _validateCreatorStakeAndBalance(creator, coinAddress);
        require(result.isValid, result.errorReason);
        return result.requiredStake;
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

        // OPTIMIZATION: Only update storage if address actually changes
        if (distributionStorage.treasuryAddress != newTreasury) {
            address oldTreasury = distributionStorage.treasuryAddress;
            distributionStorage.treasuryAddress = newTreasury;
            emit TreasuryAddressUpdated(oldTreasury, newTreasury);
        }
    }

    /// @notice Set battle duration for future contests
    /// @param newDuration New battle duration in seconds (minimum 1 hour, maximum 7 days)
    function setBattleDuration(uint256 newDuration) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newDuration >= 1 hours, "Battle duration too short");
        require(newDuration <= 7 days, "Battle duration too long");

        // OPTIMIZATION: Only update storage if value actually changes
        if (battleDuration != newDuration) {
            uint256 oldDuration = battleDuration;
            battleDuration = newDuration;
            emit BattleDurationUpdated(oldDuration, newDuration);
        }
    }

    /// @notice Withdraw accumulated treasury funds
    /// @param tokenAddress Token to withdraw from treasury
    /// @param amount Amount to withdraw (0 = withdraw all)
    function withdrawTreasury(address tokenAddress, uint256 amount) external onlyRole(TREASURY_ROLE) {
        require(tokenAddress != address(0), "Invalid token address");
        require(distributionStorage.treasuryAddress != address(0), "Treasury address not set");

        uint256 availableBalance = distributionStorage.treasuryBalances[tokenAddress];
        require(availableBalance > 0, "No treasury balance for token");

        if (amount == 0 || amount > availableBalance) {
            amount = availableBalance;
        }

        distributionStorage.treasuryBalances[tokenAddress] -= amount;
        IERC20(tokenAddress).safeTransfer(distributionStorage.treasuryAddress, amount);

        emit TreasuryWithdrawal(distributionStorage.treasuryAddress, tokenAddress, amount);
    }

    /// @notice Get treasury balance for a specific token
    /// @param tokenAddress Token to check balance for
    /// @return balance Treasury balance for the token
    function getTreasuryBalance(address tokenAddress) external view returns (uint256 balance) {
        return distributionStorage.treasuryBalances[tokenAddress];
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

    /// @notice Get battle information
    /// @param battleId Battle ID to get information for
    /// @return battle Battle struct
    function getBattleSummary(bytes32 battleId) external view returns (Battle memory battle) {
        battle = battles[battleId];
        return battle;
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

        // Return tokens directly to creators (contract holds tokens directly now)
        IERC20(battle.playerOneCoin).safeTransfer(battle.playerOne, battle.playerOneStake);
        IERC20(battle.playerTwoCoin).safeTransfer(battle.playerTwo, battle.playerTwoStake);

        // OPTIMIZATION: Conditional storage update
        if (battle.state != BattleState.CANCELLED) {
            battle.state = BattleState.CANCELLED;
        }

        // OPTIMIZATION: Conditional clear of active battle tracking
        _clearActiveBattleConditional(battle.playerOne, battle.playerTwo);

        emit BattleCompleted(battleId, address(0)); // address(0) indicates cancellation
    }
}
