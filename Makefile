##@ Formatting

check: ## Runs code quality & formatting checks
	npx biome check ./ --error-on-warnings;
.PHONY: check

format: ## Formats code and tries to fix code quality issues
	npx biome check ./ --fix --unsafe --error-on-warnings;
.PHONY: format