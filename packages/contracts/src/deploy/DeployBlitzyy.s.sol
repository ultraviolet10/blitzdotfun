// // SPDX-License-Identifier: UNLICENSED
// pragma solidity ^0.8.13;

// import {Script, console2} from "forge-std/Script.sol";
// import {Blitz} from "../Blitz.sol";

// /**
//  * @title DeployBlitz
//  * @notice Deployment script for the Blitz creator coin contest platform
//  * @dev This script deploys the Blitz contract and sets up initial configuration
//  *
//  * Usage:
//  * forge script src/deploy/DeployBlitz.s.sol --rpc-url <RPC_URL> --private-key <PRIVATE_KEY> --broadcast --verify
//  *
//  * Environment Variables (optional):
//  * - INITIAL_TREASURY: Address to set as treasury (defaults to deployer)
//  * - BATTLE_DURATION: Initial battle duration in hours (defaults to 12 hours)
//  * - VOLUME_ORACLE: Address to grant VOLUME_ORACLE_ROLE (defaults to deployer)
//  */
// contract DeployBlitzyy is Script {
//     // Default configuration values
//     uint256 public constant DEFAULT_BATTLE_DURATION = 12 hours;

//     function run() public {
//         uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
//         address deployer = vm.addr(deployerPrivateKey);

//         console2.log("Deploying Blitz contract...");
//         console2.log("Deployer address:", deployer);

//         vm.startBroadcast(deployerPrivateKey);

//         // Deploy the Blitz contract
//         Blitz blitz = new Blitz();

//         console2.log("Blitz contract deployed at:", address(blitz));

//         // Optional: Set custom battle duration if specified
//         uint256 battleDuration = vm.envOr("BATTLE_DURATION_HOURS", uint256(12)) * 1 hours;
//         if (battleDuration != DEFAULT_BATTLE_DURATION) {
//             console2.log("Setting custom battle duration:", battleDuration / 1 hours, "hours");
//             blitz.setBattleDuration(battleDuration);
//         }

//         // Optional: Set custom treasury address if specified
//         address treasuryAddress = vm.envOr("INITIAL_TREASURY", deployer);
//         if (treasuryAddress != deployer) {
//             console2.log("Setting treasury address to:", treasuryAddress);
//             blitz.setTreasuryAddress(treasuryAddress);
//         }

//         // Optional: Grant VOLUME_ORACLE_ROLE to specified address
//         address volumeOracle = vm.envOr("VOLUME_ORACLE", deployer);
//         if (volumeOracle != address(0)) {
//             console2.log("Granting VOLUME_ORACLE_ROLE to:", volumeOracle);
//             blitz.grantRole(blitz.VOLUME_ORACLE_ROLE(), volumeOracle);
//         }

//         vm.stopBroadcast();

//         // Log deployment information
//         console2.log("\n=== Blitz Deployment Complete ===");
//         console2.log("Contract Address:", address(blitz));
//         console2.log("Deployer:", deployer);
//         console2.log("Treasury Address:", treasuryAddress);
//         console2.log("Battle Duration:", battleDuration / 1 hours, "hours");
//         console2.log("Volume Oracle:", volumeOracle);

//         // Log role information
//         console2.log("\n=== Roles Granted to Deployer ===");
//         console2.log("DEFAULT_ADMIN_ROLE: true");
//         console2.log("EMERGENCY_ROLE: true");
//         console2.log("TREASURY_ROLE: true");
//         console2.log("CONTEST_MODERATOR_ROLE: true");
//         console2.log("VOLUME_ORACLE_ROLE:", volumeOracle == deployer ? "true" : "false");

//         // Verify contract state
//         _verifyDeployment(blitz, deployer, treasuryAddress, battleDuration);

//         // Save deployment information to JSON file
//         _saveDeploymentInfo(address(blitz), deployer, treasuryAddress, battleDuration, volumeOracle);
//     }

//     /**
//      * @notice Verify the deployed contract state
//      */
//     function _verifyDeployment(
//         Blitz blitz,
//         address deployer,
//         address, /* expectedTreasury */
//         uint256 expectedBattleDuration
//     ) internal view {
//         console2.log("\n=== Verifying Deployment ===");

//         // Verify roles
//         require(blitz.hasRole(blitz.DEFAULT_ADMIN_ROLE(), deployer), "Deployer missing DEFAULT_ADMIN_ROLE");
//         require(blitz.hasRole(blitz.EMERGENCY_ROLE(), deployer), "Deployer missing EMERGENCY_ROLE");
//         require(blitz.hasRole(blitz.TREASURY_ROLE(), deployer), "Deployer missing TREASURY_ROLE");
//         require(blitz.hasRole(blitz.CONTEST_MODERATOR_ROLE(), deployer), "Deployer missing CONTEST_MODERATOR_ROLE");

//         // Verify configuration
//         require(blitz.battleDuration() == expectedBattleDuration, "Battle duration mismatch");

//         // Verify contract is not paused
//         require(!blitz.paused(), "Contract should not be paused initially");

//         console2.log("All verifications passed");
//     }

//     /**
//      * @notice Save deployment information to a JSON file
//      */
//     function _saveDeploymentInfo(
//         address blitzAddress,
//         address deployer,
//         address treasury,
//         uint256 battleDuration,
//         address volumeOracle
//     ) internal {
//         string memory deploymentInfo = string(
//             abi.encodePacked(
//                 "{\n",
//                 '  "contractName": "Blitz",\n',
//                 '  "contractAddress": "',
//                 _addressToString(blitzAddress),
//                 '",\n',
//                 '  "deployerAddress": "',
//                 _addressToString(deployer),
//                 '",\n',
//                 '  "treasuryAddress": "',
//                 _addressToString(treasury),
//                 '",\n',
//                 '  "volumeOracleAddress": "',
//                 _addressToString(volumeOracle),
//                 '",\n',
//                 '  "battleDurationHours": ',
//                 _uintToString(battleDuration / 1 hours),
//                 ",\n",
//                 '  "chainId": ',
//                 _uintToString(block.chainid),
//                 ",\n",
//                 '  "blockNumber": ',
//                 _uintToString(block.number),
//                 ",\n",
//                 '  "timestamp": ',
//                 _uintToString(block.timestamp),
//                 "\n",
//                 "}"
//             )
//         );

//         try vm.writeFile("./out/blitz-deployment.json", deploymentInfo) {
//             console2.log("Deployment info saved to: ./out/blitz-deployment.json");
//         } catch {
//             console2.log("WARNING: Failed to save deployment info to file");
//         }
//     }

//     /**
//      * @notice Convert address to string
//      */
//     function _addressToString(address addr) internal pure returns (string memory) {
//         return vm.toString(addr);
//     }

//     /**
//      * @notice Convert uint to string
//      */
//     function _uintToString(uint256 value) internal pure returns (string memory) {
//         return vm.toString(value);
//     }
// }
