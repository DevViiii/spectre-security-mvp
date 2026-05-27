"""
Spectre Security — FastAPI application factory.

Hardening applied in Phase 9:
  - Security headers middleware
  - Request size limits
  - Rate limiting (slowapi)
  - Structured logging
  - Error sanitization in production
  - Explicit CORS origins (no wildcard in production)
  - Startup env validation (via config.py)
"""
from __future__ import annotations

from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.core.logging import configure_logging
from app.core.middleware import (
    ErrorSanitizationMiddleware,
    RequestIDMiddleware,
    RequestSizeLimitMiddleware,
    SecurityHeadersMiddleware,
    StructuredLoggingMiddleware,
)
from app.rate_limit import limiter, _rate_limit_exceeded_handler

# Router imports
from app.auth.router import router as auth_router
from app.auth.session import router as session_router
from app.audit.router import router as audit_router
from app.health import router as health_router
from app.organizations.router import router as organizations_router
from app.reports.router import router as reports_router
from app.rules.router import router as rules_router
from app.scanner.router import router as scanner_router
from app.shield.router import router as shield_router
from app.auth_magic.router import router as magic_router

# Model imports — required for Alembic to detect all tables
import app.organizations.model          # noqa: F401
import app.organizations.user_model     # noqa: F401
import app.organizations.client_model   # noqa: F401
import app.reports.model                # noqa: F401

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "startup",
        environment=settings.ENVIRONMENT,
        llm_judge=settings.LLM_JUDGE_ENABLED,
        rate_limiting=settings.RATE_LIMIT_ENABLED,
    )
    yield
    logger.info("shutdown")


def create_app() -> FastAPI:
    configure_logging()

    app = FastAPI(
        title="Spectre Security API",
        version="0.1.0",
        description="AI runtime security — adversarial testing and DLP",
        docs_url="/docs" if not settings.is_production else None,
        redoc_url=None,
        openapi_url="/openapi.json" if not settings.is_production else None,
        lifespan=lifespan,
    )

    # ── Rate limiter ───────────────────────────────────────────────────────
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # ── Middleware (order matters — outermost runs first) ──────────────────
    # Error sanitization must be outermost
    app.add_middleware(ErrorSanitizationMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestSizeLimitMiddleware, max_size_mb=settings.MAX_REQUEST_SIZE_MB)
    app.add_middleware(StructuredLoggingMiddleware)
    app.add_middleware(RequestIDMiddleware)

    # CORS — explicit origins only, never wildcard in production
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # ── Routers ────────────────────────────────────────────────────────────
    app.include_router(health_router,        prefix="",               tags=["health"])
    app.include_router(auth_router,          prefix="/auth",          tags=["auth"])
    app.include_router(session_router,       prefix="/auth/session",  tags=["auth"])
    app.include_router(scanner_router,       prefix="/scans",         tags=["scanner"])
    app.include_router(shield_router,        prefix="/shield",        tags=["shield"])
    app.include_router(reports_router,       prefix="/reports",       tags=["reports"])
    app.include_router(audit_router,         prefix="/audit",         tags=["audit"])
    app.include_router(organizations_router, prefix="/organizations", tags=["organizations"])
    app.include_router(rules_router,         prefix="/rules",         tags=["rules"])
    app.include_router(magic_router,         prefix="/auth/magic",    tags=["magic-auth"])

    return app


app = create_app()
