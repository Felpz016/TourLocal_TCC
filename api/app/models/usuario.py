from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import FaixaPreco, TipoUsuario


class Usuario(Base):
    __tablename__ = "usuario"

    id_usuario: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    senha_hash: Mapped[str] = mapped_column(String(255))
    tipo: Mapped[TipoUsuario] = mapped_column(Enum(TipoUsuario))
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    perfil: Mapped["Perfil | None"] = relationship(back_populates="usuario", uselist=False)


class Perfil(Base):
    __tablename__ = "perfil"

    id_perfil: Mapped[int] = mapped_column(primary_key=True)
    id_usuario: Mapped[int] = mapped_column(
        ForeignKey("usuario.id_usuario", ondelete="CASCADE"), unique=True
    )
    faixa_orcamento: Mapped[FaixaPreco | None] = mapped_column(Enum(FaixaPreco))
    # Lista separada por vírgulas, ex.: "vegetariano,sem_gluten".
    restricoes_alimentares: Mapped[str | None] = mapped_column(String(255))
    # RF03 pede a necessidade de acessibilidade no perfil; o campo não constava no DER original.
    necessita_acessibilidade: Mapped[bool] = mapped_column(Boolean, default=False)
    tempo_disponivel_min: Mapped[int | None]
    raio_busca_km: Mapped[Decimal] = mapped_column(Numeric(4, 1), default=Decimal("3.0"))

    usuario: Mapped[Usuario] = relationship(back_populates="perfil")
