"""add_cv_parsing_status

Revision ID: a7b2c3d4e5f6
Revises: d05a36f38db1
Create Date: 2025-12-08 01:40:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a7b2c3d4e5f6"
down_revision: str | Sequence[str] | None = "d05a36f38db1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Add parsing status and error columns to cvs table."""
    # Create the enum type
    parsing_status_enum = postgresql.ENUM(
        "pending", "processing", "completed", "failed", name="parsingstatus", create_type=False
    )
    parsing_status_enum.create(op.get_bind(), checkfirst=True)

    # Add parsing_status column with default 'pending'
    op.add_column(
        "cvs",
        sa.Column(
            "parsing_status",
            parsing_status_enum,
            nullable=False,
            server_default="pending",
        ),
    )

    # Add parsing_error column (nullable)
    op.add_column(
        "cvs",
        sa.Column("parsing_error", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    """Remove parsing status and error columns from cvs table."""
    op.drop_column("cvs", "parsing_error")
    op.drop_column("cvs", "parsing_status")

    # Drop the enum type
    parsing_status_enum = postgresql.ENUM(
        "pending", "processing", "completed", "failed", name="parsingstatus"
    )
    parsing_status_enum.drop(op.get_bind(), checkfirst=True)
