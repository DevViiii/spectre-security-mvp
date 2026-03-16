import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Policy(Base):
    __tablename__ = "policies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # rule_type: regex | ner | keyword
    rule_type: Mapped[str] = mapped_column(String(20), nullable=False)
    rule_config: Mapped[dict] = mapped_column(JSONB, nullable=False)

    # action: block | redact | alert
    action: Mapped[str] = mapped_column(String(20), default="alert", nullable=False)

    # applies_to: input | output | both
    applies_to: Mapped[str] = mapped_column(String(20), default="both", nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    is_builtin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    violations: Mapped[list["Violation"]] = relationship(
        "Violation", back_populates="policy", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Policy {self.name!r} type={self.rule_type!r} action={self.action!r}>"


class Violation(Base):
    __tablename__ = "violations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    policy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("policies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # direction: input | output
    direction: Mapped[str] = mapped_column(String(10), nullable=False)
    action_taken: Mapped[str] = mapped_column(String(20), nullable=False)
    matched_pattern: Mapped[str | None] = mapped_column(String(200), nullable=True)
    context_excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)  # first 500 chars only
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    policy: Mapped["Policy"] = relationship("Policy", back_populates="violations")

    def __repr__(self) -> str:
        return f"<Violation policy={self.policy_id} direction={self.direction!r} action={self.action_taken!r}>"
