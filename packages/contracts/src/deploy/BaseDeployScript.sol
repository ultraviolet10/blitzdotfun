// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";

/**
 * @dev Base script for deployments that automatically tracks contract addresses and ABIs
 * After running deploy script, outputs: out/deployment.json and out/abiMap.json
 *
 * out/deployment.json maps contract aliases to deployed addresses
 * out/abiMap.json maps contract aliases to contract names for ABI lookups
 */
abstract contract BaseDeployScript is Script {
    /// @dev JSON serialization keys
    string internal constant deploymentJsonKey = "deployment_key";
    string internal constant abiMapJsonKey = "abiMap_key";

    /// @dev Serialized JSON strings
    string internal deploymentJson = "";
    string internal abiMapJson = "";

    /// @dev Controls JSON output (can be disabled for testing)
    bool internal output = true;

    /// @dev Disable JSON output
    function dontOutput() public {
        output = false;
    }

    /**
     * @dev Log deployed contract with alias and name mapping
     * @param contractAlias Unique identifier for this deployment instance
     * @param contractName Solidity contract name for ABI mapping
     * @param deployedAddress The deployed contract address
     */
    function deployed(string memory contractAlias, string memory contractName, address deployedAddress) internal {
        if (output) {
            console2.log("Deployed", contractAlias, "at", deployedAddress);
            deploymentJson = vm.serializeAddress(deploymentJsonKey, contractAlias, deployedAddress);
            if (bytes(contractName).length > 0) {
                abiMapJson = vm.serializeString(abiMapJsonKey, contractAlias, contractName);
            }
        }
    }

    /**
     * @dev Log deployed contract (alias = contract name)
     */
    function deployed(string memory contractName, address deployedAddress) internal {
        deployed(contractName, contractName, deployedAddress);
    }

    /**
     * @dev Write deployment artifacts to files
     */
    function writeDeploymentJson() internal {
        if (output) {
            vm.writeJson(deploymentJson, "./out/deployment.json");
            vm.writeJson(abiMapJson, "./out/abiMap.json");
        }
    }

    /**
     * @dev Override this in your deployment script
     */
    function deploy() internal virtual {}

    /**
     * @dev Main entry point - calls deploy() and handles JSON output
     */
    function run() external virtual {
        vm.startBroadcast();
        deploy();
        vm.stopBroadcast();
        writeDeploymentJson();
    }
}
