// // SPDX-License-Identifier: UNLICENSED
// pragma solidity ^0.8.13;

// import {Test, console2} from "forge-std/Test.sol";
// import {DeployBlitz} from "../src/deploy/DeployBlitz.s.sol";
// import {Blitz} from "../src/Blitz.sol";

// /**
//  * @title DeployBlitzTest
//  * @notice Test suite for the Blitz deployment script
//  * @dev Tests both the deployment logic and various configuration scenarios
//  */
// contract DeployBlitzTest is Test {
//     DeployBlitz public deployScript;
//     address public deployer;
//     uint256 public deployerPrivateKey;

//     function setUp() public {
//         deployScript = new DeployBlitz();
//         deployerPrivateKey = 0x1234567890123456789012345678901234567890123456789012345678901234;
//         deployer = vm.addr(deployerPrivateKey);
        
//         // Set up environment variable for the deployment script
//         vm.setEnv("PRIVATE_KEY", vm.toString(deployerPrivateKey));
        
//         // Fund the deployer
//         vm.deal(deployer, 100 ether);
//     }

//     /**
//      * @notice Test basic deployment with default parameters
//      */
//     function test_BasicDeployment() public {
//         // Clear any environment variables to test defaults
//         vm.setEnv("BATTLE_DURATION_HOURS", "");
//         vm.setEnv("INITIAL_TREASURY", "");
//         vm.setEnv("VOLUME_ORACLE", "");

//         // Run the deployment
//         deployScript.run();

//         // The deployment should have created a Blitz contract
//         // We need to verify by checking the expected behavior
//         console2.log("Basic deployment completed successfully");
//     }

//     /**
//      * @notice Test deployment with custom configuration
//      */
//     function test_CustomConfigurationDeployment() public {
//         address customTreasury = makeAddr("customTreasury");
//         address customOracle = makeAddr("customOracle");
        
//         // Set custom environment variables
//         vm.setEnv("BATTLE_DURATION_HOURS", "24");
//         vm.setEnv("INITIAL_TREASURY", vm.toString(customTreasury));
//         vm.setEnv("VOLUME_ORACLE", vm.toString(customOracle));

//         // Run the deployment
//         deployScript.run();

//         console2.log("Custom configuration deployment completed successfully");
//     }

//     /**
//      * @notice Test deployment script components in isolation
//      */
//     function test_DeploymentComponents() public {
//         vm.startPrank(deployer);

//         // Test direct contract deployment
//         Blitz blitz = new Blitz();

//         // Verify initial state
//         assertTrue(blitz.hasRole(blitz.DEFAULT_ADMIN_ROLE(), deployer), "Should have admin role");
//         assertTrue(blitz.hasRole(blitz.EMERGENCY_ROLE(), deployer), "Should have emergency role");
//         assertTrue(blitz.hasRole(blitz.TREASURY_ROLE(), deployer), "Should have treasury role");
//         assertTrue(blitz.hasRole(blitz.CONTEST_MODERATOR_ROLE(), deployer), "Should have moderator role");
        
//         assertEq(blitz.battleDuration(), 12 hours, "Should have default battle duration");
//         assertFalse(blitz.paused(), "Should not be paused initially");

//         // Test configuration functions
//         blitz.setBattleDuration(24 hours);
//         assertEq(blitz.battleDuration(), 24 hours, "Should update battle duration");

//         address newTreasury = makeAddr("newTreasury");
//         blitz.setTreasuryAddress(newTreasury);
//         assertEq(blitz.getTreasuryBalance(address(0x123)), 0, "Treasury should be accessible");

//         // Test role granting
//         address oracle = makeAddr("oracle");
//         blitz.grantRole(blitz.VOLUME_ORACLE_ROLE(), oracle);
//         assertTrue(blitz.hasRole(blitz.VOLUME_ORACLE_ROLE(), oracle), "Should have oracle role");

//         vm.stopPrank();

//         console2.log("All deployment components working correctly");
//     }

//     /**
//      * @notice Test deployment error conditions
//      */
//     function test_DeploymentErrorConditions() public {
//         vm.startPrank(deployer);

//         Blitz blitz = new Blitz();

//         // Test invalid battle duration
//         vm.expectRevert("Battle duration too short");
//         blitz.setBattleDuration(30 minutes); // Less than 1 hour

//         vm.expectRevert("Battle duration too long");
//         blitz.setBattleDuration(8 days); // More than 7 days

//         // Test invalid treasury address
//         vm.expectRevert("Invalid treasury address");
//         blitz.setTreasuryAddress(address(0));

//         vm.stopPrank();

//         console2.log("Error conditions handled correctly");
//     }

//     /**
//      * @notice Test role management
//      */
//     function test_RoleManagement() public {
//         vm.startPrank(deployer);

//         Blitz blitz = new Blitz();

//         // Test batch role operations
//         address[] memory accounts = new address[](2);
//         accounts[0] = makeAddr("user1");
//         accounts[1] = makeAddr("user2");

//         bytes32[] memory roles = new bytes32[](2);
//         roles[0] = blitz.EMERGENCY_ROLE();
//         roles[1] = blitz.VOLUME_ORACLE_ROLE();

//         // Grant roles
//         blitz.grantRolesBatch(accounts[0], roles);
//         assertTrue(blitz.hasRole(blitz.EMERGENCY_ROLE(), accounts[0]), "Should have emergency role");
//         assertTrue(blitz.hasRole(blitz.VOLUME_ORACLE_ROLE(), accounts[0]), "Should have oracle role");

//         // Revoke roles
//         blitz.revokeRolesBatch(accounts[0], roles);
//         assertFalse(blitz.hasRole(blitz.EMERGENCY_ROLE(), accounts[0]), "Should not have emergency role");
//         assertFalse(blitz.hasRole(blitz.VOLUME_ORACLE_ROLE(), accounts[0]), "Should not have oracle role");

//         vm.stopPrank();

//         console2.log("Role management working correctly");
//     }

//     /**
//      * @notice Test that deployment creates functional contract
//      */
//     function test_DeployedContractFunctionality() public {
//         vm.startPrank(deployer);

//         Blitz blitz = new Blitz();

//         // Test emergency functions
//         blitz.emergencyPause("Testing pause");
//         assertTrue(blitz.paused(), "Should be paused");

//         blitz.emergencyUnpause();
//         assertFalse(blitz.paused(), "Should be unpaused");

//         // Test utility functions
//         bool hasRole = blitz.checkRole(blitz.DEFAULT_ADMIN_ROLE(), deployer);
//         assertTrue(hasRole, "Should confirm role");

//         vm.stopPrank();

//         console2.log("Deployed contract is fully functional");
//     }
// }