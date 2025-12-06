"""SavedJob model for tracking job applications."""

import enum
import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import ENUM, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.db.models.tailored_cv import TailoredCV
    from app.db.models.user import User


class JobStatus(str, enum.Enum):
    """Status of a saved job in the application pipeline."""

    SAVED = "saved"
    APPLYING = "applying"
    APPLIED = "applied"
    INTERVIEW = "interview"
    OFFER = "offer"
    REJECTED = "rejected"


class SavedJob(Base, UUIDMixin, TimestampMixin):
    """SavedJob model for tracking jobs the user is interested in."""

    __tablename__ = "saved_jobs"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    job_source: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    job_external_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    job_data: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
    )
    status: Mapped[JobStatus] = mapped_column(
        ENUM(JobStatus, name="job_status", create_type=True),
        default=JobStatus.SAVED,
        nullable=False,
    )
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    tailored_cv_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tailored_cvs.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="saved_jobs",
    )
    tailored_cv: Mapped["TailoredCV | None"] = relationship(
        "TailoredCV",
        back_populates="saved_job",
        foreign_keys=[tailored_cv_id],
    )

    # Indexes for common queries
    __table_args__ = (
        Index("ix_saved_jobs_user_id", "user_id"),
        Index("ix_saved_jobs_user_status", "user_id", "status"),
        Index("ix_saved_jobs_source_external", "job_source", "job_external_id"),
    )

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<SavedJob(id={self.id}, source={self.job_source}, status={self.status})>"
