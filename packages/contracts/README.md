# Blitz Contracts

Smart contracts for the Blitz creator coin contest platform with automated ABI/address export for monorepo consumption.

## Quick Start

```bash
# Setup
cp .env.example .env
make build

# Deploy to local Anvil
make anvil-background
make deploy-local

# View deployed addresses
make addresses

Build and Test

# Build contracts
make build

# Run tests
make test

# Clean artifacts
make clean

Local Development

# Start Anvil (blocking)
make anvil

# Start Anvil in background
make anvil-background

# Deploy to local network
make deploy-local

# Dry run deployment (no transactions)
make dry-local

# Kill Anvil process
make kill-anvil

Production Deployment

# Deploy to Sepolia testnet
make deploy-sepolia

# Dry run on Sepolia
make dry-sepolia

Configuration

Environment Variables

Edit .env file:

# Contract settings
BATTLE_DURATION_HOURS=12
INITIAL_TREASURY=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
VOLUME_ORACLE=0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

# For testnet deployments
INFURA_PROJECT_ID=your_infura_project_id
SEPOLIA_PRIVATE_KEY=your_sepolia_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key

Deployment Modes

- DEPLOY=deploy - Execute transactions (default)
- DEPLOY=dry - Simulate without transactions
- DEPLOY=resume - Resume failed deployment

Using Contracts in Other Packages

Package Exports

// In your TypeScript project
import { abis, deployment } from '@your-org/blitz-contracts/blitz/anvil';

// Get contract ABI
const blitzAbi = abis.Blitz;

// Get contract address
const blitzAddress = deployment.Blitz;

// Use with viem
import { createPublicClient, http } from 'viem';
import { localhost } from 'viem/chains';

const client = createPublicClient({
chain: localhost,
transport: http()
});

const contract = getContract({
address: blitzAddress,
abi: blitzAbi,
client
});

Available Exports

- ./blitz/anvil - Local Anvil deployments
- ./blitz/sepolia - Sepolia testnet deployments
- ./blitz/ethereum - Ethereum mainnet deployments

Type Safety

Full TypeScript support with auto-generated types:

import type { ContractToAbi, Deployment } from '@your-org/blitz-contracts/blitz/anvil';

// Strongly typed contract addresses
const addresses: Deployment = deployment;

// Strongly typed ABI access
const contractAbis: ContractToAbi = abis;

Generated Artifacts

After deployment, the following files are created:

- deployments/{chain}/blitz/deployment.json - Contract addresses
- deployments/{chain}/blitz/abiMap.json - Contract name mappings
- deployments/{chain}/blitz/abis.json - Raw ABI data
- deployments/{chain}/blitz/abis.ts - TypeScript exports

Advanced Usage

Custom Deployment Script

# Direct forge script usage
forge script src/deploy/DeployBlitz.s.sol \
--rpc-url http://localhost:8545 \
--private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
--broadcast -vvv

Manual ABI Generation

# Extract specific contract ABI
forge inspect Blitz abi --pretty > blitz-abi.json

# Generate TypeScript types manually
make post-deploy

View All Deployed Addresses

make addresses

Directory Structure

├── src/
│   ├── Blitz.sol                    # Main contract
│   └── deploy/
│       ├── BaseDeployScript.sol     # Deployment base class
│       └── DeployBlitz.s.sol       # Blitz deployment script
├── scripts/
│   ├── abi_types_fragment_begin.ts.txt  # TypeScript header
│   └── abi_types_fragment_end.ts.txt    # TypeScript footer
├── deployments/                    # Generated deployment artifacts
│   ├── anvil/blitz/               # Local deployments
│   ├── sepolia/blitz/             # Sepolia deployments
│   └── ethereum/blitz/            # Mainnet deployments
├── Makefile                       # Build automation
├── foundry.toml                   # Foundry configuration
├── package.json                   # Package exports
└── .env                          # Environment variables

Monorepo Integration

This setup is designed for seamless monorepo integration:

1. Type-safe imports - Generated TypeScript provides compile-time validation
2. Environment-specific exports - Different builds for local/testnet/mainnet
3. Automated updates - Deployments automatically update exported artifacts
4. Clean package boundaries - Other packages import via package exports

Example consuming package:

// packages/frontend/src/contracts.ts
import { abis, deployment } from '@your-org/blitz-contracts/blitz/anvil';

export const blitzConfig = {
address: deployment.Blitz,
abi: abis.Blitz,
} as const