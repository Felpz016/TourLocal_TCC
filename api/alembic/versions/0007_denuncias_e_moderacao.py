"""denuncias e avaliacao mantida pela moderacao

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
    # Quem denunciou qual avaliação (RN06), para limitar denúncias por conta.
    op.create_table(
        "denuncia",
        sa.Column("id_denuncia", sa.Integer(), nullable=False),
        sa.Column("id_avaliacao", sa.Integer(), nullable=False),
        sa.Column("id_usuario", sa.Integer(), nullable=False),
        sa.Column("data_registro", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["id_avaliacao"], ["avaliacao.id_avaliacao"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["id_usuario"], ["usuario.id_usuario"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id_denuncia"),
        sa.UniqueConstraint("id_usuario", "id_avaliacao", name="uq_denuncia_usuario_avaliacao"),
    )


def downgrade() -> None:
    op.drop_table("denuncia")
    op.drop_column("avaliacao", "mantida_em")
