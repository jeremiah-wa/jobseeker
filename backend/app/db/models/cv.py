"""CV model for storing user resumes."""

import enum
import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, Enum, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.db.models.tailored_cv import TailoredCV
    from app.db.models.user import User


class ParsingStatus(str, enum.Enum):
    """CV parsing status enum."""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class CV(Base, UUIDMixin, TimestampMixin):
    """CV model for storing uploaded resumes and parsed content."""

    __tablename__ = "cvs"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    file_path: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
    )
    raw_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    parsed_data: Mapped[dict[str, Any] | None] = mapped_column(
        JSONB,
        nullable=True,
    )
    parsing_status: Mapped[ParsingStatus] = mapped_column(
        Enum(ParsingStatus, values_callable=lambda x: [e.value for e in x]),
        default=ParsingStatus.PENDING,
        nullable=False,
    )
    parsing_error: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    is_primary: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="cvs",
    )
    tailored_cvs: Mapped[list["TailoredCV"]] = relationship(
        "TailoredCV",
        back_populates="base_cv",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    # Indexes for common queries
    __table_args__ = (
        Index("ix_cvs_user_id", "user_id"),
        Index("ix_cvs_user_primary", "user_id", "is_primary"),
    )

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<CV(id={self.id}, filename={self.filename})>"
