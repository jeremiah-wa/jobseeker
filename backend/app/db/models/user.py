"""User model."""

import enum
from typing import TYPE_CHECKING

from sqlalchemy import Index, String
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.db.models.cv import CV
    from app.db.models.saved_job import SavedJob
    from app.db.models.tailored_cv import TailoredCV


class UserTier(str, enum.Enum):
    """User subscription tier for future monetization."""

    FREE = "free"
    PREMIUM = "premium"


class User(Base, UUIDMixin, TimestampMixin):
    """User model for authentication and profile."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    tier: Mapped[UserTier] = mapped_column(
        ENUM(UserTier, name="user_tier", create_type=True),
        default=UserTier.FREE,
        nullable=False,
    )

    # Relationships
    cvs: Mapped[list["CV"]] = relationship(
        "CV",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    saved_jobs: Mapped[list["SavedJob"]] = relationship(
        "SavedJob",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    tailored_cvs: Mapped[list["TailoredCV"]] = relationship(
        "TailoredCV",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    # Indexes for common queries
    __table_args__ = (
        Index("ix_users_email_lower", "email"),
        Index("ix_users_tier", "tier"),
    )

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<User(id={self.id}, email={self.email})>"
