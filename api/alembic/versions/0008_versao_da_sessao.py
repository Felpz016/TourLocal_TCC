"""versao da sessao do usuario

Revision ID: 0008
Revises: 0007
Create Date: 2026-11-05 14:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0008"
down_revision: str | None = "0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Começa em 0 para todos: os tokens atuais continuam valendo até a próxima troca de senha.
    op.add_column(
        "usuario",
        sa.Column("versao_sessao", sa.Integer(), server_default="0", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("usuario", "versao_sessao")
