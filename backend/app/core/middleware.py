"""
Security middleware for Spectre Security.

Adds:
  1. Security headers on every response
  2. Request size enforcement
  3. Structured request logging with timing
  4. Error sanitization (no stack traces to clients in production)
"""
from __future__ import annotations

import time
import uuid

import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.config import settings

logger = structlog.get_logger(__name__)

# Security headers applied to every response
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
}

# HSTS only in production (breaks local HTTP dev)
PRODUCTION_HEADERS = {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
}

# Minimal CSP — tighten once you know all CDN sources
CSP = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline'; "
    "style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data:; "
    "connect-src 'self'; "
    "frame-ancestors 'none';"
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds security headers to every response."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        for key, value in SECURITY_HEADERS.items():
            response.headers[key] = value
        if settings.is_production:
            for key, value in PRODUCTION_HEADERS.items():
                response.headers[key] = value
        response.headers["Content-Security-Policy"] = CSP
        return response


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """
    Rejects requests with Content-Length exceeding the configured limit.
    Prevents large payload attacks before any processing occurs.
    """

    def __init__(self, app, max_size_mb: int = 10):
        super().__init__(app)
        self.max_size = max_size_mb * 1024 * 1024  # Convert to bytes

    async def dispatch(self, request: Request, call_next) -> Response:
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.max_size:
            return JSONResponse(
                status_code=413,
                content={
                    "error": {
                        "code": "REQUEST_TOO_LARGE",
                        "message": f"Request body exceeds {settings.MAX_REQUEST_SIZE_MB}MB limit.",
                    }
                },
            )
        return await call_next(request)


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Assigns a unique request ID to every request.
    Returned in the X-Request-ID response header.
    Injected into structlog context for log correlation.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id

        with structlog.contextvars.bound_contextvars(request_id=request_id):
            response = await call_next(request)

        response.headers["X-Request-ID"] = request_id
        return response


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    """
    Logs every request with timing, status, and method.
    Skips /health endpoints to avoid log noise.
    """

    SKIP_PATHS = {"/health", "/health/ready"}

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.url.path in self.SKIP_PATHS:
            return await call_next(request)

        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 2)

        log = logger.info if response.status_code < 400 else logger.warning
        log(
            "http_request",
            method=request.method,
            path=request.url.path,
            status=response.status_code,
            duration_ms=duration_ms,
            client=request.client.host if request.client else "unknown",
        )
        return response


class ErrorSanitizationMiddleware(BaseHTTPMiddleware):
    """
    In production, catches unhandled 500 errors and returns a generic message.
    Prevents stack traces and internal details from leaking to clients.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            logger.exception(
                "unhandled_exception",
                path=request.url.path,
                method=request.method,
                error=str(exc),
            )
            if settings.is_production:
                return JSONResponse(
                    status_code=500,
                    content={
                        "error": {
                            "code": "INTERNAL_ERROR",
                            "message": "An internal error occurred. Our team has been notified.",
                            "request_id": getattr(request.state, "request_id", None),
                        }
                    },
                )
            raise
