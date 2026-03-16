# CLAUDE.md - Spectre Security

## Project Overview

Spectre Security is an adversarial testing and AI-DLP runtime protection platform. It lets teams run automated attack suites against LLM-powered applications and enforce real-time data loss prevention policies on LLM inputs/outputs.

## Architecture

- **Backend**: FastAPI (Python 3.12) + SQLAlchemy 2.0 async + Celery workers
- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS + TanStack Query + Zustand
- **Database**: PostgreSQL 16 (asyncpg driver)
- **Cache/Broker**: Redis 7 (session cache + Celery broker)
- **SDK**: Python package (`spectre-shield`) for integrating Shield DLP into LLM apps

## Project Structure

```
backend/app/
  auth/        - API key generation, JWT authentication
  scanner/     - Adversarial attack execution, scoring, classification
  shield/      - Runtime DLP protection, proxy, NER (spaCy), blocklists
  reports/     - PDF generation (WeasyPrint) and S3 storage
  audit/       - Audit logging
  worker/      - Celery tasks (scan execution, report generation)
  core/        - Database, Redis, middleware, logging, response envelope

frontend/src/
  app/(auth)/login/     - API key login
  app/(dashboard)/      - Scanner, Shield, Settings pages
  components/           - Layout (Sidebar, TopBar), UI, Scanner, Shield components
  lib/                  - API client, hooks, Zustand stores, types

sdk/python/spectre_shield/  - Shield SDK client, middleware, types
```

## Development

### Prerequisites
- Docker Desktop

### Quick Start
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
make dev          # docker compose up --build
make migrate      # alembic upgrade head
```

### Services (local)
| Service   | URL                       |
|-----------|---------------------------|
| API docs  | http://localhost:8000/docs |
| Dashboard | http://localhost:3000      |
| Flower    | http://localhost:5555      |
| Postgres  | localhost:5432             |
| Redis     | localhost:6379             |

### Key Commands
```bash
make dev            # Full stack (all services)
make dev-backend    # Backend + deps only
make dev-frontend   # Frontend only (assumes backend running)
make migrate        # Run Alembic migrations
make migration name="description"  # Create new migration
make db-reset       # Drop/recreate DB + migrate
make test           # Full test suite with coverage
make test-unit      # Unit tests only (no DB needed)
make test-int       # Integration tests
make lint           # Ruff linter
make type-check     # mypy
```

### Testing
- pytest with pytest-asyncio (asyncio_mode = "auto")
- Unit tests use in-memory SQLite, no external deps required
- Integration tests in `backend/tests/integration/`
- HTTP mocking via `respx`
- Coverage target: `app/`

### Linting & Types
- **Ruff** with rules: E, F, I, UP, B, SIM
- **mypy** with `--ignore-missing-imports`
- **ESLint** + `eslint-config-next` for frontend

## Patterns & Conventions

- **Async everywhere**: all DB/Redis/HTTP operations are async
- **Service layer**: each module has `service.py` separating business logic from routes
- **Dependency injection**: FastAPI `Depends()` for DB sessions, auth, settings
- **Structured logging**: `structlog.get_logger(__name__)` with event-based keys (e.g., `logger.error("scan_failed", scan_id=id, error=str(exc))`)
- **Response envelope**: all API responses wrapped via `core/response.py`
- **Background tasks**: CPU/IO-heavy work (scans, reports) dispatched to Celery queues (`scans`, `reports`)
- **Attack definitions**: YAML files loaded by `scanner/attacks/loader.py`

## Environment Variables

Key backend settings (see `backend/.env.example` for full list):
- `ENVIRONMENT` - development/staging/production
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` / `CELERY_BROKER_URL` / `CELERY_RESULT_BACKEND`
- `OPENAI_API_KEY` - for LLM judge (optional in dev, `LLM_JUDGE_ENABLED=false`)
- `AWS_*` / `S3_BUCKET_NAME` - for report storage (falls back to /tmp in dev)
