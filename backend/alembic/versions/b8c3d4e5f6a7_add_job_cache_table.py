"""add_job_cache_table

Revision ID: b8c3d4e5f6a7
Revises: a7b2c3d4e5f6
Create Date: 2025-12-08 19:58:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b8c3d4e5f6a7"
down_revision: str | Sequence[str] | None = "a7b2c3d4e5f6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create job_cache table for caching search results."""
    op.create_table(
        "job_cache",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("cache_key", sa.String(255), nullable=False, unique=True),
        sa.Column("source", sa.String(50), nullable=False),
        sa.Column("cache_type", sa.String(20), nullable=False, server_default="search"),
        sa.Column("data", postgresql.JSONB(), nullable=False),
        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # Create indexes
    op.create_index("ix_job_cache_cache_key", "job_cache", ["cache_key"])
    op.create_index("ix_job_cache_expires_at", "job_cache", ["expires_at"])
    op.create_index("ix_job_cache_source", "job_cache", ["source"])
    op.create_index("ix_job_cache_type", "job_cache", ["cache_type"])
    op.create_index("ix_job_cache_key_source", "job_cache", ["cache_key", "source"])


def downgrade() -> None:
    """Drop job_cache table."""
    op.drop_index("ix_job_cache_key_source", table_name="job_cache")
    op.drop_index("ix_job_cache_type", table_name="job_cache")
    op.drop_index("ix_job_cache_source", table_name="job_cache")
    op.drop_index("ix_job_cache_expires_at", table_name="job_cache")
    op.drop_index("ix_job_cache_cache_key", table_name="job_cache")
    op.drop_table("job_cache")
