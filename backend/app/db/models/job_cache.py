"""Job cache model for caching search results."""

from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDMixin


class JobCache(Base, UUIDMixin):
    """Cache for job search results and job details.

    Uses PostgreSQL JSONB for flexible data storage.
    Cache entries have expiration times for automatic invalidation.
    """

    __tablename__ = "job_cache"

    cache_key: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
        unique=True,
    )
    source: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    cache_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="search",
    )
    data: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_job_cache_source", "source"),
        Index("ix_job_cache_type", "cache_type"),
        Index("ix_job_cache_key_source", "cache_key", "source"),
    )

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<JobCache(key={self.cache_key}, source={self.source}, expires={self.expires_at})>"

    @property
    def is_expired(self) -> bool:
        """Check if this cache entry has expired."""
        from datetime import UTC

        return datetime.now(UTC) > self.expires_at
