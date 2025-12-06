"""TailoredCV model for job-specific resume versions."""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Index, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.db.models.cv import CV
    from app.db.models.saved_job import SavedJob
    from app.db.models.user import User


class TailoredCV(Base, UUIDMixin, TimestampMixin):
    """TailoredCV model for job-specific resume versions."""

    __tablename__ = "tailored_cvs"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    base_cv_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cvs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    version: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="tailored_cvs",
    )
    base_cv: Mapped["CV"] = relationship(
        "CV",
        back_populates="tailored_cvs",
    )
    saved_job: Mapped["SavedJob | None"] = relationship(
        "SavedJob",
        back_populates="tailored_cv",
        uselist=False,
        foreign_keys="SavedJob.tailored_cv_id",
    )

    # Indexes for common queries
    __table_args__ = (
        Index("ix_tailored_cvs_user_id", "user_id"),
        Index("ix_tailored_cvs_base_cv", "base_cv_id"),
        Index("ix_tailored_cvs_user_base", "user_id", "base_cv_id"),
    )

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<TailoredCV(id={self.id}, version={self.version})>"
