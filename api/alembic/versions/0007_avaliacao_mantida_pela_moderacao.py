"""avaliacao mantida pela moderacao

Revision ID: 0007
Revises: 0006
Create Date: 2026-11-05 09:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0007"
down_revision: str | None = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Coluna nova e opcional: nenhuma avaliação existente muda de situação.
    op.add_column("avaliacao", sa.Column("mantida_em", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("avaliacao", "mantida_em")
