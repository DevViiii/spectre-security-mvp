.PHONY: help dev dev-backend dev-frontend build push \
        migrate migration db-reset shell shell-worker \
        test test-unit test-int lint type-check \
        deploy health sdk-install

# ── Colours ────────────────────────────────────────────────────────────────
BOLD  := \033[1m
RESET := \033[0m
GREEN := \033[32m
CYAN  := \033[36m

help: ## Show this help
	@echo ""
	@echo "  $(BOLD)Spectre Security$(RESET) — Development Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# ── Development ────────────────────────────────────────────────────────────

dev: ## Start the full local stack (all services)
	docker compose up --build

dev-backend: ## Start backend + dependencies only (faster iteration)
	docker compose up --build postgres redis api worker

dev-frontend: ## Start frontend only (assumes backend is running)
	cd frontend && npm run dev

# ── Database ───────────────────────────────────────────────────────────────

migrate: ## Run Alembic migrations (alembic upgrade head)
	docker compose exec api alembic upgrade head

migration: ## Create a new migration. Usage: make migration name="add_column"
	docker compose exec api alembic revision --autogenerate -m "$(name)"

db-reset: ## Drop and recreate the dev DB, run migrations
	docker compose exec postgres psql -U spectre -c "DROP DATABASE IF EXISTS spectre;"
	docker compose exec postgres psql -U spectre -c "CREATE DATABASE spectre;"
	$(MAKE) migrate

# ── Shell access ───────────────────────────────────────────────────────────

shell: ## Open a shell in the running API container
	docker compose exec api bash

shell-worker: ## Open a shell in the running Celery worker container
	docker compose exec worker bash

# ── Testing ────────────────────────────────────────────────────────────────

test: ## Run the full test suite
	cd backend && pytest tests/ -v --cov=app --cov-report=term-missing

test-unit: ## Run unit tests only (no DB/HTTP required)
	cd backend && pytest tests/unit/ -v

test-int: ## Run integration tests only
	cd backend && pytest tests/integration/ -v

lint: ## Run ruff linter on the backend
	cd backend && ruff check app/ worker/ && echo "✓ Lint passed"

type-check: ## Run mypy type checker on the backend
	cd backend && mypy app/ --ignore-missing-imports

# ── Build ──────────────────────────────────────────────────────────────────

build: ## Build all Docker images
	docker compose build

push: ## Push images to ECR (requires AWS credentials and ECR_REGISTRY env var)
	@if [ -z "$(ECR_REGISTRY)" ]; then echo "ECR_REGISTRY is not set"; exit 1; fi
	docker tag spectre-security-api:latest $(ECR_REGISTRY)/spectre-api:latest
	docker tag spectre-security-worker:latest $(ECR_REGISTRY)/spectre-worker:latest
	docker tag spectre-security-frontend:latest $(ECR_REGISTRY)/spectre-frontend:latest
	docker push $(ECR_REGISTRY)/spectre-api:latest
	docker push $(ECR_REGISTRY)/spectre-worker:latest
	docker push $(ECR_REGISTRY)/spectre-frontend:latest

# ── Deployment ─────────────────────────────────────────────────────────────

deploy: ## Deploy to production server
	./infra/scripts/deploy.sh

health: ## Check health of all services
	./infra/scripts/health-check.sh

# ── SDK ────────────────────────────────────────────────────────────────────

sdk-install: ## Install the Shield SDK in development mode
	cd sdk/python && pip install -e .

# ── Quick start ────────────────────────────────────────────────────────────

setup: ## First-time setup: copy env files and install SDK
	@[ -f backend/.env ] || cp backend/.env.example backend/.env && echo "✓ backend/.env created"
	@[ -f frontend/.env.local ] || cp frontend/.env.example frontend/.env.local && echo "✓ frontend/.env.local created"
	@cd sdk/python && pip install -e . && echo "✓ SDK installed"
	@echo ""
	@echo "  $(GREEN)Setup complete.$(RESET) Next steps:"
	@echo "  1. Edit $(BOLD)backend/.env$(RESET) — add your OPENAI_API_KEY"
	@echo "  2. Run $(BOLD)make dev$(RESET) to start the stack"
	@echo "  3. Run $(BOLD)make migrate$(RESET) to create database tables"
	@echo "  4. Open $(BOLD)http://localhost:8000/docs$(RESET) for the API"
	@echo "  5. Open $(BOLD)http://localhost:3000$(RESET) for the dashboard"
	@echo ""
