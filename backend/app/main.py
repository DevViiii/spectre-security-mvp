from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core.database import engine, Base
from app.core.logging import configure_logging
from app.core.middleware import RequestIDMiddleware, StructuredLoggingMiddleware
from app.core.response import envelope_error_handler, SpectreError

from app.auth.router import router as auth_router
from app.scanner.router import router as scanner_router
from app.shield.router import router as shield_router
from app.reports.router import router as reports_router
from app.audit.router import router as audit_router
from app.health import router as health_router
from app.organizations.router import router as organizations_router
from app.rules.router import router as rules_router

import app.organizations.model          # noqa: F401
import app.organizations.user_model     # noqa: F401
import app.organizations.client_model   # noqa: F401
import app.reports.model                # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    # Create tables on startup in development; use Alembic in production
    if settings.ENVIRONMENT == "development":
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="Spectre Security API",
        description="Adversarial testing and AI-DLP runtime protection",
        version="0.1.0",
        docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
        redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
        lifespan=lifespan,
    )

    # Middleware (order matters — outermost is applied last, runs first)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(StructuredLoggingMiddleware)
    app.add_middleware(RequestIDMiddleware)

    # Exception handlers
    app.add_exception_handler(SpectreError, envelope_error_handler)

    # Routers
    app.include_router(health_router)
    app.include_router(auth_router,    prefix="/auth",         tags=["auth"])
    app.include_router(scanner_router, prefix="/scans",        tags=["scanner"])
    app.include_router(shield_router,  prefix="/shield",       tags=["shield"])
    app.include_router(reports_router, prefix="/reports",      tags=["reports"])
    app.include_router(audit_router,   prefix="/audit",        tags=["audit"])
    app.include_router(organizations_router, prefix="/organizations", tags=["organizations"])
    app.include_router(rules_router, prefix="/rules", tags=["rules"])

    return app


app = create_app()
