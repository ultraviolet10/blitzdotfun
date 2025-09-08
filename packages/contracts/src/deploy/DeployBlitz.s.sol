// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {console2} from "forge-std/Script.sol";
import {Blitz} from "../Blitz.sol";
import {MockERC20} from "../mocks/MockERC20.sol";
import {BaseDeployScript} from "./BaseDeployScript.sol";

/**
 * @title DeployBlitz
 * @notice Deployment script for the Blitz creator coin contest platform
 */
contract DeployBlitz is BaseDeployScript {
    bytes32 public constant SALT_TOKEN_A = bytes32(uint256(0));
    uint256 public constant DEFAULT_BATTLE_DURATION = 12 hours;
    /// Address of the multichain CREATE2 deterministic deployer (used by Foundry).
    address public constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

    MockERC20 public mockTokenA;

    function deploy() internal override {
        address deployer = msg.sender;

        console2.log("Deploying Blitz contract...");
        console2.log("Deployer address:", deployer);

        // Deploy the Blitz contract
        Blitz blitz = new Blitz();
        // Deploy the mock ERC20 token
        mockTokenA = deployMockToken("MockTokenA", "MTA", SALT_TOKEN_A);

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

        // Volume oracle removed in optimization - backend handles volume calculations

        // Verify deployment
        _verifyDeployment(blitz, deployer, treasuryAddress, battleDuration);

        // Log final state
        _logDeploymentSummary(address(blitz), deployer, treasuryAddress, battleDuration);
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

    function _logDeploymentSummary(address blitzAddress, address deployer, address treasury, uint256 battleDuration)
        internal
        view
    {
        console2.log("\n=== Blitz Deployment Complete ===");
        console2.log("Contract Address:", blitzAddress);
        console2.log("Deployer:", deployer);
        console2.log("Treasury Address:", treasury);
        console2.log("Battle Duration:", battleDuration / 1 hours, "hours");
        console2.log("Volume Calculation: Backend-handled");
    }

    function deployMockToken(string memory name, string memory symbol, bytes32 salt) internal returns (MockERC20) {
        (address addr,) = deployDeterministic(
            name, "MockERC20", type(MockERC20).creationCode, abi.encode(name, symbol, uint8(18)), salt
        );
        return MockERC20(addr);
    }

    /**
     * Deploys a contract deterministically given its creation code, abi-encoded arguments and a
     * salt. This checks if the contract is already deployed, logs but succeeds if it is. This
     * automatically calls `deployed` with the provided contract alias and name, even if the
     * contract was already deployed.
     *
     * Example: `deployDeterministic("MockTokenA", "MockERC20", type(MockTokenA).creationCode, abi.encode("MockTokenA", "MTA", 18), 0)`
     *
     * @return (addr, deployed) The address of the contract and a boolean indicating
     *   if it is newly deployed by this call.
     */
    function deployDeterministic(
        string memory contractAlias,
        string memory contractName,
        bytes memory creationCode,
        bytes memory constructorArgs,
        bytes32 salt
    ) internal returns (address payable, bool) {
        address payable predictedAddress = getCreate2Address(creationCode, constructorArgs, salt);

        if (getContractSize(predictedAddress) > 0) {
            if (output) console2.log("Contract already deployed", contractAlias, predictedAddress);
            deployed(contractAlias, contractName, predictedAddress);
            return (predictedAddress, false);
        }

        address payable addr = _deployDeterministicCreationCode(abi.encodePacked(creationCode, constructorArgs), salt);
        if (addr == address(0)) {
            if (output) console2.log("Deploy failed", contractAlias);
            revert("Deploy failed");
        }

        deployed(contractAlias, contractName, addr);
        return (addr, true);
    }

    /**
     * Returns the predicted address of a CREATE2 contract deployment using the CREATE2
     * deterministic deployer, given the creation code, the abi-encoded constructor arguments and a
     * salt.
     */
    function getCreate2Address(bytes memory creationCode, bytes memory constructorArgs, bytes32 salt)
        internal
        pure
        returns (address payable)
    {
        return getCreate2Address(abi.encodePacked(creationCode, constructorArgs), salt);
    }

    /**
     * Returns the predicted address of a CREATE2 contract deployment using the CREATE2
     * deterministic deployer, given the entire creation code and a salt.
     */
    function getCreate2Address(bytes memory creationCode, bytes32 salt) internal pure returns (address payable) {
        return payable(
            address(
                uint160(
                    uint256(keccak256(abi.encodePacked(bytes1(0xff), CREATE2_DEPLOYER, salt, keccak256(creationCode))))
                )
            )
        );
    }

    /**
     * Returns the size of the given contract.
     */
    function getContractSize(address addr) internal view returns (uint256 size) {
        assembly ("memory-safe") {
            size := extcodesize(addr)
        }
    }

    function _deployDeterministicCreationCode(bytes memory creationCode, bytes32 salt)
        internal
        returns (address payable addr)
    {
        assembly ("memory-safe") {
            addr := create2(0, add(creationCode, 0x20), mload(creationCode), salt)
        }
    }
}
