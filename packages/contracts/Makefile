SHELL := /bin/bash

# Include .env file for local development
-include .env

# Default configuration
export CONFIG ?= LOCAL
export ANVIL_PORT ?= 8545
export ANVIL_BLOCK_TIME ?= 2

# Environment-specific RPC URLs
RPC_LOCAL := http://localhost:$(ANVIL_PORT)
# RPC_SEPOLIA := https://sepolia.infura.io/v3/$(INFURA_PROJECT_ID)

# Private keys (use environment variables)
PRIVATE_KEY_LOCAL := 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
# PRIVATE_KEY_SEPOLIA := $(SEPOLIA_PRIVATE_KEY)

# Deployment mode: deploy, dry, or resume  
DEPLOY ?= deploy

# Deployment script
DEPLOY_SCRIPT := src/deploy/DeployBlitz.s.sol

ifeq ($(DEPLOY),deploy)
	BROADCAST_FLAG := --broadcast
endif

ifeq ($(DEPLOY),dry)
	BROADCAST_FLAG :=
endif

ifeq ($(DEPLOY),resume)
	BROADCAST_FLAG := --resume
endif

####################################################################################################
##@ Code Quality

forge-fmt-check:
	@forge fmt --check src || true
.PHONY: forge-fmt-check

forge-fmt:
	@forge fmt src || true
.PHONY: forge-fmt

check: forge-fmt-check ## Checks formatting & linting (no files touched)
.PHONY: check

format: forge-fmt ## Formats & lint (autofixes)
.PHONY: format

####################################################################################################
# Build

build: ## Builds all contracts
	forge build
.PHONY: build

####################################################################################################
##@ Testing

test: ## Runs tests
	forge test -vvv
.PHONY: test

testv: ## Runs test with max verbosity
	forge test -vvvv
.PHONY: testv

test-fork: ## Runs test on a fork of the network (via RPC_$(CONFIG) env variable)
	forge test --gas-report --fork-url $(RPC_$(CONFIG))
.PHONY: test-fork

test-gas: ## Runs test and generate a gas report
	forge test --gas-report
.PHONY: test-gas

####################################################################################################
# Deployment

# Deploys contracts locally, to testnet or mainnet depending on the $CONFIG value.
deploy:
	$(call run-deploy-script,$(DEPLOY_SCRIPT))
	$(call post-deploy)
	$(call save-deployment)
.PHONY: deploy

# Define deployment function based on CONFIG
define run-deploy-script
	forge script $(1) \
		--rpc-url $(RPC_$(CONFIG)) \
		--private-key $(PRIVATE_KEY_$(CONFIG)) \
		$(BROADCAST_FLAG) \
		-vvv
endef

# Post-process deployment artifacts
define post-deploy
	@echo "Generating ABI exports..."
	@cat out/deployment.json && printf "\n"

	@# Extract ABIs and create mapping using node-jq
	@export CONTRACTS=$$(node-jq '[.[]] | unique' out/abiMap.json) && \
	node-jq '[.[]] | unique[]' out/abiMap.json \
		| xargs -I'{}' forge inspect {} abi --json \
		| node-jq --slurp --argjson contracts "$$CONTRACTS" \
		'[$$contracts, .] | transpose | map({ (.[0]): .[1] }) | add' \
		> out/abis.json

	@# Generate TypeScript ABI file
	@cat scripts/abi_types_fragment_begin.ts.txt > out/abis.ts
	@printf "\n\nconst contractToAbi = (" >> out/abis.ts
	@cat out/abis.json >> out/abis.ts
	@printf ") as const\n\n" >> out/abis.ts
	@printf "const aliasToContract = (" >> out/abis.ts
	@cat out/abiMap.json >> out/abis.ts
	@printf ") as const\n\n" >> out/abis.ts
	@printf "export const deployment = (" >> out/abis.ts
	@cat out/deployment.json >> out/abis.ts
	@printf ") as const\n\n" >> out/abis.ts
	@cat scripts/abi_types_fragment_end.ts.txt >> out/abis.ts
endef

# Chain detection and deployment saving
define save-deployment
	@CHAIN_ID=$$(cast chain-id --rpc-url $(RPC_$(CONFIG))) && \
	case $$CHAIN_ID in \
		31337) DEPLOYMENT_NAME="local" ;; \
		11155111) DEPLOYMENT_NAME="testnet" ;; \
		1) DEPLOYMENT_NAME="mainnet" ;; \
		*) DEPLOYMENT_NAME="unknown-$$CHAIN_ID" ;; \
	esac && \
	DEPLOYMENT_DIR="deployments/$$DEPLOYMENT_NAME" && \
	mkdir -p "$$DEPLOYMENT_DIR" && \
	cp out/{deployment.json,abiMap.json,abis.json,abis.ts} "$$DEPLOYMENT_DIR/" && \
	echo "Deployment saved to $$DEPLOYMENT_DIR"
endef

####################################################################################################
# Environment-specific deployments

deploy-local: ## Deploy to local Anvil
	make deploy CONFIG=LOCAL

deploy-sepolia: ## Deploy to Sepolia testnet  
	make deploy CONFIG=SEPOLIA

# Dry run deployments
dry-local: ## Dry run on local Anvil
	make deploy CONFIG=LOCAL DEPLOY=dry

dry-sepolia: ## Dry run on Sepolia
	make deploy CONFIG=SEPOLIA DEPLOY=dry

.PHONY: deploy-local deploy-sepolia dry-local dry-sepolia

####################################################################################################
# Utilities

addresses: ## Show deployed contract addresses
	@find deployments -name "deployment.json" -exec echo "=== {} ===" \; -exec cat {} \; -exec echo \;

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.PHONY: addresses help

.DEFAULT_GOAL := help
