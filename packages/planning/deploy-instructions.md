# Blitz Protocol Deployment Instructions

Production-grade deployment system with automatic ABI generation and monorepo integration.

## Quick Start

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (forge, anvil, cast)
- [Bun](https://bun.sh/) package manager
- [node-jq](https://github.com/sanack/node-jq) for JSON processing

### Install Dependencies

```bash
# From monorepo root
bun install
```

## Build and Test

```bash
# Build contracts and compile TypeScript types
make build

# Run tests
make test

# Run tests with gas reporting
make test-gas

# Format and check code
make format
make check
```

## Local Development Workflow

### 1. Start Local Blockchain

```bash
# Terminal 1: Start Anvil
anvil --port 8545 --block-time 2
```

### 2. Deploy Contracts

```bash
# Terminal 2: Deploy with automatic ABI generation
make deploy-local

# Or use dry run first
make dry-local
```

### 3. Use Generated ABIs

After deployment, ABIs are automatically available in your mini-app:

```typescript
// packages/mini-app/src/contracts/blitz.ts
import { abis, deployment } from "@blitzdotfun/blitz-contracts/local"

export const contractAddresses = {
  blitz: deployment.Blitz,
} as const

export const contractAbis = {
  blitz: abis.Blitz,
} as const
```

## Environment-Specific Deployments

### Local (Anvil)

```bash
make deploy-local           # Deploy to local Anvil
make dry-local             # Dry run on local Anvil
```

### Testnet (Sepolia)

```bash
# Set environment variables in .env
SEPOLIA_PRIVATE_KEY=your_private_key_here
INFURA_PROJECT_ID=your_infura_project_id

make deploy-testnet        # Deploy to Sepolia
make dry-testnet          # Dry run on Sepolia
```

### Mainnet

```bash
# Set environment variables in .env  
MAINNET_PRIVATE_KEY=your_private_key_here
INFURA_PROJECT_ID=your_infura_project_id
ETHERSCAN_API_KEY=your_etherscan_key

make deploy-mainnet       # Deploy to mainnet
```

## Configuration Options

### Environment Variables

Create a `.env` file in the contracts directory:

```env
# Network Configuration
INFURA_PROJECT_ID=your_infura_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key

# Private Keys (use different keys for different networks)
SEPOLIA_PRIVATE_KEY=0x...
MAINNET_PRIVATE_KEY=0x...

# Contract Configuration
BATTLE_DURATION_HOURS=12
INITIAL_TREASURY=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
VOLUME_ORACLE=0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
```

### Advanced Configuration

```bash
# Custom deployment with environment overrides
CONFIG=LOCAL \
DEPLOY=deploy \
BATTLE_DURATION_HOURS=24 \
INITIAL_TREASURY=0x... \
VOLUME_ORACLE=0x... \
make deploy
```

## Generated Artifacts

### Directory Structure

```txt
deployments/
├── local/          # Local Anvil deployments
├── testnet/        # Sepolia deployments  
└── mainnet/        # Mainnet deployments
    ├── deployment.json    # Contract addresses
    ├── abiMap.json       # Contract name mappings
    ├── abis.json         # Combined ABIs
    └── abis.ts           # TypeScript definitions
```

### Package Exports

The contracts package provides environment-specific exports:

```typescript
// Local development
import { abis, deployment } from "@blitzdotfun/blitz-contracts/local"

// Testnet
import { abis, deployment } from "@blitzdotfun/blitz-contracts/testnet" 

// Mainnet
import { abis, deployment } from "@blitzdotfun/blitz-contracts/mainnet"
```

## Contract Verification

### Automatic Verification

```bash
# Testnet with verification
ETHERSCAN_API_KEY=your_key make deploy-testnet

# Mainnet with verification  
ETHERSCAN_API_KEY=your_key make deploy-mainnet
```

### Manual Verification

```bash
# Verify deployed contract
forge verify-contract \
  --chain-id 11155111 \
  --num-of-optimizations 200 \
  --compiler-version 0.8.13 \
  CONTRACT_ADDRESS \
  src/Blitz.sol:Blitz \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

## Troubleshooting

### Common Issues

1. **node-jq not found**: Install with `bun install` or `npm install -g node-jq`
2. **Cast command failed**: Ensure Foundry is installed and updated
3. **Private key issues**: Verify `.env` file and key format (with 0x prefix)
4. **RPC connection**: Check network URLs and API keys

### Debug Commands

```bash
# Check deployment status
make addresses

# View deployment logs
cat broadcast/DeployBlitz.s.sol/31337/run-latest.json

# Test ABI imports
node -e "console.log(require('@blitzdotfun/blitz-contracts/local'))"
```

### Reset Local Environment

```bash
# Clean all artifacts
make clean

# Restart Anvil and redeploy
pkill anvil
anvil --port 8545 --block-time 2
make deploy-local
```

## Production Checklist

Before mainnet deployment:

- [ ] Test on Sepolia testnet
- [ ] Verify contract source code
- [ ] Review gas costs and optimizations  
- [ ] Confirm treasury and oracle addresses
- [ ] Set appropriate battle duration
- [ ] Backup private keys securely
- [ ] Monitor deployment transaction
