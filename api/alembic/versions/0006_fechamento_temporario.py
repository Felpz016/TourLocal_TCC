"""fechamento temporario

Revision ID: 0006
Revises: 0005
Create Date: 2026-10-27 21:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "estabelecimento",
        sa.Column(
            "fechado_temporariamente", sa.Boolean(), server_default=sa.false(), nullable=False
        ),
    )


def downgrade() -> None:
    op.drop_column("estabelecimento", "fechado_temporariamente")
