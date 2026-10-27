from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, SmallInteger, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.enums import StatusAvaliacao


class Avaliacao(Base):
    __tablename__ = "avaliacao"
    # RN04: uma avaliação por usuário e estabelecimento.
    __table_args__ = (
        UniqueConstraint("id_usuario", "id_estab", name="uq_avaliacao_usuario_estab"),
    )

    id_avaliacao: Mapped[int] = mapped_column(primary_key=True)
    id_usuario: Mapped[int] = mapped_column(ForeignKey("usuario.id_usuario", ondelete="CASCADE"))
    id_estab: Mapped[int] = mapped_column(
        ForeignKey("estabelecimento.id_estab", ondelete="CASCADE")
    )
    nota: Mapped[int] = mapped_column(SmallInteger)
    comentario: Mapped[str | None] = mapped_column(Text)
    data_registro: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    status: Mapped[StatusAvaliacao] = mapped_column(
        Enum(StatusAvaliacao), default=StatusAvaliacao.PUBLICADA
    )


class Favorito(Base):
    __tablename__ = "favorito"

    id_usuario: Mapped[int] = mapped_column(
        ForeignKey("usuario.id_usuario", ondelete="CASCADE"), primary_key=True
    )
    id_estab: Mapped[int] = mapped_column(
        ForeignKey("estabelecimento.id_estab", ondelete="CASCADE"), primary_key=True
    )
    data_inclusao: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
