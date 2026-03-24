"""
Spectre Security — application configuration.

All settings are read from environment variables.
Required variables are validated at startup — the app will not start
if any required variable is missing or invalid.

Production checklist:
  - ENVIRONMENT=production
  - SECRET_KEY must be ≥32 chars (generate with: openssl rand -hex 32)
  - OPENAI_API_KEY must be set if LLM_JUDGE_ENABLED=true
  - DATABASE_URL must use asyncpg driver
  - ALLOWED_ORIGINS must be set explicitly (not *)
"""
from __future__ import annotations

import secrets
import sys
from typing import Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Core ───────────────────────────────────────────────────────────────
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    SECRET_KEY: str = Field(default_factory=lambda: secrets.token_hex(32))
    DEBUG: bool = False

    # ── Database ───────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://spectre:spectre@localhost:5432/spectre"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    DATABASE_ECHO: bool = False

    # ── Redis ──────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # ── API ────────────────────────────────────────────────────────────────
    API_PREFIX: str = "/api/v1"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]
    MAX_REQUEST_SIZE_MB: int = 10

    # ── Rate limiting ──────────────────────────────────────────────────────
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_DEFAULT: str = "100/minute"
    RATE_LIMIT_SCAN_CREATE: str = "10/minute"
    RATE_LIMIT_AUTH_CREATE: str = "5/minute"
    RATE_LIMIT_SHIELD_INSPECT: str = "300/minute"

    # ── Shield ─────────────────────────────────────────────────────────────
    SHIELD_POLICY_CACHE_TTL: int = 30
    SHIELD_MAX_INSPECTION_MS: int = 30
    SHIELD_MAX_TEXT_LENGTH: int = 50_000

    # ── Scanner ────────────────────────────────────────────────────────────
    SCAN_TIMEOUT_SECONDS: int = 300
    SCAN_ATTACK_TIMEOUT_SECONDS: int = 30
    SCAN_MAX_CONCURRENT_ATTACKS: int = 5

    # ── LLM Judge ─────────────────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    LLM_JUDGE_ENABLED: bool = False
    LLM_JUDGE_MODEL: str = "gpt-4o-mini"

    # ── Reports ────────────────────────────────────────────────────────────
    REPORT_FILES_DIR: str = "/app/report_files"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = ""
    S3_REPORT_URL_EXPIRY: int = 3600

    # ── Magic link auth ────────────────────────────────────────────────────
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "onboarding@resend.dev"
    FRONTEND_URL: str = "http://localhost:3000"

    # ── Logging ────────────────────────────────────────────────────────────
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: Literal["json", "pretty"] = "pretty"

    # ── Validators ────────────────────────────────────────────────────────

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_must_be_strong(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters. Generate with: openssl rand -hex 32")
        return v

    @field_validator("DATABASE_URL")
    @classmethod
    def database_url_must_use_asyncpg(cls, v: str) -> str:
        if "postgresql" in v and "asyncpg" not in v:
            raise ValueError("DATABASE_URL must use the asyncpg driver: postgresql+asyncpg://...")
        return v

    @field_validator("LOG_FORMAT", mode="before")
    @classmethod
    def set_log_format_from_env(cls, v: str, info) -> str:
        # Default to JSON in production
        return v

    @model_validator(mode="after")
    def validate_production_requirements(self) -> "Settings":
        if self.ENVIRONMENT == "production":
            errors = []

            if self.DEBUG:
                errors.append("DEBUG must be False in production")

            if self.LLM_JUDGE_ENABLED and not self.OPENAI_API_KEY:
                errors.append("OPENAI_API_KEY is required when LLM_JUDGE_ENABLED=true")

            if self.LOG_FORMAT != "json":
                # Auto-correct in production rather than erroring
                object.__setattr__(self, "LOG_FORMAT", "json")

            if errors:
                print("\n[STARTUP ERROR] Production configuration invalid:", file=sys.stderr)
                for e in errors:
                    print(f"  - {e}", file=sys.stderr)
                print("", file=sys.stderr)
                sys.exit(1)

        return self

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"

    @property
    def cors_origins(self) -> list[str]:
        return self.ALLOWED_ORIGINS


def _load_settings() -> Settings:
    try:
        return Settings()
    except Exception as e:
        print(f"\n[STARTUP ERROR] Invalid configuration: {e}", file=sys.stderr)
        print("Check your .env file and environment variables.\n", file=sys.stderr)
        sys.exit(1)


settings = _load_settings()
