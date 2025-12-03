# Makefile for Noir & Ztarknet Integration

# Variables
CIRCUIT_DIR = noir-circuit
CAIRO_DIR = cairo-contracts

# Default target
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  install-noir      - Install Noir development toolchain"
	@echo "  install-barretenberg - Install Barretenberg prover"
	@echo "  install-garaga    - Install Garaga SDK"
	@echo "  circuit-new       - Create a new Noir circuit"
	@echo "  circuit-check     - Check Noir circuit syntax"
	@echo "  circuit-execute   - Execute Noir circuit"
	@echo "  circuit-prove     - Generate proof for Noir circuit"
	@echo "  circuit-vk        - Generate verification key"
	@echo "  garaga-gen        - Generate Cairo verifier with Garaga"
	@echo "  cairo-build       - Build Cairo contract"
	@echo "  cairo-declare     - Declare Cairo contract"
	@echo "  cairo-deploy      - Deploy Cairo contract"
	@echo "  artifacts         - Copy artifacts to app folder"
	@echo "  account-create    - Create Starknet account"
	@echo "  account-deploy    - Deploy Starknet account"
	@echo "  account-balance   - Check Starknet account balance"
	@echo "  clean             - Clean generated files"

# Install tools
.PHONY: install-noir
install-noir:
	@echo "Installing Noir development toolchain..."
	@echo "Please download from https://noir-lang.org/docs/getting_started/installation/"

.PHONY: install-barretenberg
install-barretenberg:
	@echo "Installing Barretenberg prover..."
	@echo "This is typically included with Noir installation"

.PHONY: install-garaga
install-garaga:
	@echo "Installing Garaga SDK..."
	pip install garaga==0.18.1

# Circuit operations
.PHONY: circuit-new
circuit-new:
	@if [ ! -d "$(CIRCUIT_DIR)" ]; then \
		echo "Creating new Noir project..."; \
		nargo new $(CIRCUIT_DIR); \
	else \
		echo "Circuit directory already exists"; \
	fi

.PHONY: circuit-check
circuit-check:
	@echo "Checking Noir circuit..."
	cd $(CIRCUIT_DIR) && nargo check

.PHONY: circuit-execute
circuit-execute:
	@echo "Executing Noir circuit..."
	cd $(CIRCUIT_DIR) && nargo execute witness

.PHONY: circuit-prove
circuit-prove:
	@echo "Generating proof..."
	cd $(CIRCUIT_DIR) && bb prove --scheme ultra_honk --zk --oracle_hash starknet -b ./target/circuit.json -w ./target/witness.gz -o ./target

.PHONY: circuit-vk
circuit-vk:
	@echo "Generating verification key..."
	cd $(CIRCUIT_DIR) && bb write_vk --scheme ultra_honk --oracle_hash starknet -b ./target/circuit.json -o ./target

# Garaga operations
.PHONY: garaga-gen
garaga-gen:
	@echo "Generating Cairo verifier with Garaga..."
	garaga gen --system ultra_starknet_zk_honk --vk $(CIRCUIT_DIR)/target/vk --project-name verifier

# Cairo operations
.PHONY: cairo-build
cairo-build:
	@echo "Building Cairo contract..."
	cd $(CAIRO_DIR) && scarb build

.PHONY: cairo-declare
cairo-declare:
	@echo "Declaring Cairo contract..."
	cd $(CAIRO_DIR) && sncast declare --contract-name ProofRegistry

.PHONY: cairo-deploy
cairo-deploy:
	@echo "Deploying Cairo contract..."
	@echo "Please run: sncast deploy --class-hash <CLASS_HASH>"

# Artifacts
.PHONY: artifacts
artifacts:
	@echo "Copying artifacts to app folder..."
	@echo "This would copy necessary files to the frontend app directory"

# Account operations
.PHONY: account-create
account-create:
	@echo "Creating Starknet account..."
	sncast account create

.PHONY: account-deploy
account-deploy:
	@echo "Deploying Starknet account..."
	sncast account deploy

.PHONY: account-balance
account-balance:
	@echo "Checking Starknet account balance..."
	sncast account balance

# Clean
.PHONY: clean
clean:
	@echo "Cleaning generated files..."
	rm -rf $(CIRCUIT_DIR)/target
	rm -rf $(CIRCUIT_DIR)/Prover.toml
	rm -rf verifier/
	find . -name "*.proof" -delete
	find . -name "*.vk" -delete
	find . -name "*.public_inputs" -delete