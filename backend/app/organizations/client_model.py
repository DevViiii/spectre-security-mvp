import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ApiClient(Base):
    """
    Represents a third-party application or service that integrates
    with Spectre Security via the Shield SDK or Scanner API.

    Distinct from ApiKey (user dashboard keys) — ApiClients are for
    programmatic integrations: CI/CD pipelines, LLM apps using the SDK,
    automated scan triggers.
    """
    __tablename__ = "api_clients"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # client_type: sdk | scanner | webhook | ci
    client_type: Mapped[str] = mapped_column(String(20), default="sdk", nullable=False)

    key_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    key_prefix: Mapped[str] = mapped_column(String(12), nullable=False)

    # Scopes control what this client can do
    # e.g. ["shield:inspect", "scanner:read"] or ["*"] for full access
    scopes: Mapped[str] = mapped_column(String(500), default="shield:inspect", nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<ApiClient {self.name!r} type={self.client_type!r}>"
