// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {console2} from "forge-std/Script.sol";
import {Blitz} from "../Blitz.sol";
import {BaseDeployScript} from "./BaseDeployScript.sol";

/**
 * @title DeployBlitz
 * @notice Deployment script for the Blitz creator coin contest platform
 */
contract DeployBlitz is BaseDeployScript {
    uint256 public constant DEFAULT_BATTLE_DURATION = 12 hours;

    function deploy() internal override {
        address deployer = msg.sender;

        console2.log("Deploying Blitz contract...");
        console2.log("Deployer address:", deployer);

        // Deploy the Blitz contract
        Blitz blitz = new Blitz();

        // Register deployment for ABI/address export
        deployed("Blitz", address(blitz));

        console2.log("Blitz contract deployed at:", address(blitz));

        // Configure battle duration
        uint256 battleDuration = vm.envOr("BATTLE_DURATION_HOURS", uint256(12)) * 1 hours;
        if (battleDuration != DEFAULT_BATTLE_DURATION) {
            console2.log("Setting custom battle duration:", battleDuration / 1 hours, "hours");
            blitz.setBattleDuration(battleDuration);
        }

        // Configure treasury
        address treasuryAddress = vm.envOr("INITIAL_TREASURY", deployer);
        if (treasuryAddress != deployer) {
            console2.log("Setting treasury address to:", treasuryAddress);
            blitz.setTreasuryAddress(treasuryAddress);
        }

        // Configure volume oracle
        address volumeOracle = vm.envOr("VOLUME_ORACLE", deployer);
        if (volumeOracle != address(0) && volumeOracle != deployer) {
            console2.log("Granting VOLUME_ORACLE_ROLE to:", volumeOracle);
            blitz.grantRole(blitz.VOLUME_ORACLE_ROLE(), volumeOracle);
        }

        // Verify deployment
        _verifyDeployment(blitz, deployer, treasuryAddress, battleDuration);

        // Log final state
        _logDeploymentSummary(address(blitz), deployer, treasuryAddress, battleDuration, volumeOracle);
    }

    function _verifyDeployment(
        Blitz blitz,
        address deployer,
        address, /* expectedTreasury */
        uint256 expectedBattleDuration
    ) internal view {
        console2.log("\n=== Verifying Deployment ===");
        require(blitz.hasRole(blitz.DEFAULT_ADMIN_ROLE(), deployer), "Missing DEFAULT_ADMIN_ROLE");
        require(blitz.battleDuration() == expectedBattleDuration, "Battle duration mismatch");
        require(!blitz.paused(), "Contract should not be paused initially");
        console2.log("All verifications passed");
    }

    function _logDeploymentSummary(
        address blitzAddress,
        address deployer,
        address treasury,
        uint256 battleDuration,
        address volumeOracle
    ) internal view {
        console2.log("\n=== Blitz Deployment Complete ===");
        console2.log("Contract Address:", blitzAddress);
        console2.log("Deployer:", deployer);
        console2.log("Treasury Address:", treasury);
        console2.log("Battle Duration:", battleDuration / 1 hours, "hours");
        console2.log("Volume Oracle:", volumeOracle);
    }
}
