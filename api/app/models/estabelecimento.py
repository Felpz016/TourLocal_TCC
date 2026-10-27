from datetime import time
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Column,
    Enum,
    ForeignKey,
    Index,
    Numeric,
    SmallInteger,
    String,
    Table,
    Text,
    Time,
    UniqueConstraint,
    false,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import Eixo, FaixaPreco

# Tabela associativa N:N entre estabelecimentos e categorias.
estab_categoria = Table(
    "estab_categoria",
    Base.metadata,
    Column(
        "id_estab", ForeignKey("estabelecimento.id_estab", ondelete="CASCADE"), primary_key=True
    ),
    Column(
        "id_categoria", ForeignKey("categoria.id_categoria", ondelete="CASCADE"), primary_key=True
    ),
)


class Categoria(Base):
    __tablename__ = "categoria"

    id_categoria: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(80))
    eixo: Mapped[Eixo] = mapped_column(Enum(Eixo))


class Estabelecimento(Base):
    __tablename__ = "estabelecimento"
    # RNF02: índice composto para a filtragem por área retangular antes do Haversine.
    __table_args__ = (
        Index("ix_estabelecimento_lat_lng", "latitude", "longitude"),
        UniqueConstraint("origem_externa", name="uq_estabelecimento_origem_externa"),
    )

    id_estab: Mapped[int] = mapped_column(primary_key=True)
    id_responsavel: Mapped[int | None] = mapped_column(
        ForeignKey("usuario.id_usuario", ondelete="SET NULL")
    )
    nome: Mapped[str] = mapped_column(String(150))
    descricao: Mapped[str | None] = mapped_column(Text)
    endereco: Mapped[str] = mapped_column(String(255))
    # Contato exibido nos detalhes (RF10); não constava no DER original.
    telefone: Mapped[str | None] = mapped_column(String(40))
    site: Mapped[str | None] = mapped_column(String(255))
    latitude: Mapped[Decimal] = mapped_column(Numeric(9, 6))
    longitude: Mapped[Decimal] = mapped_column(Numeric(9, 6))
    faixa_preco: Mapped[FaixaPreco | None] = mapped_column(Enum(FaixaPreco))
    acessibilidade: Mapped[bool] = mapped_column(Boolean, default=False)
    # Opções para restrições alimentares, separadas por vírgula (ex.: "vegetariano,vegano").
    # Usadas na aderência ao perfil (RF03); o campo não constava no DER original.
    opcoes_alimentares: Mapped[str | None] = mapped_column(String(120))
    # RN01: só estabelecimentos verificados aparecem nas recomendações.
    verificado: Mapped[bool] = mapped_column(Boolean, default=False)
    # RF16: o comerciante pode fechar o local por um tempo (reforma, férias); enquanto isso
    # ele sai das recomendações. O campo não constava no DER original.
    fechado_temporariamente: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=false()
    )
    # Identificador na fonte de dados pública (ex.: "osm:node/123"), para a importação (RF19)
    # poder ser repetida sem duplicar registros. Fica vazio nos cadastros feitos por comerciantes.
    origem_externa: Mapped[str | None] = mapped_column(String(60))

    categorias: Mapped[list[Categoria]] = relationship(secondary=estab_categoria)
    horarios: Mapped[list["HorarioFuncionamento"]] = relationship(
        back_populates="estabelecimento", cascade="all, delete-orphan"
    )
    fotos: Mapped[list["Foto"]] = relationship(cascade="all, delete-orphan")


class HorarioFuncionamento(Base):
    __tablename__ = "horario_funcionamento"

    id_horario: Mapped[int] = mapped_column(primary_key=True)
    id_estab: Mapped[int] = mapped_column(
        ForeignKey("estabelecimento.id_estab", ondelete="CASCADE")
    )
    # 0 = segunda-feira ... 6 = domingo (mesma convenção de datetime.weekday()).
    dia_semana: Mapped[int] = mapped_column(SmallInteger)
    hora_abertura: Mapped[time] = mapped_column(Time)
    hora_fechamento: Mapped[time] = mapped_column(Time)

    estabelecimento: Mapped[Estabelecimento] = relationship(back_populates="horarios")


class Foto(Base):
    __tablename__ = "foto"

    id_foto: Mapped[int] = mapped_column(primary_key=True)
    id_estab: Mapped[int] = mapped_column(
        ForeignKey("estabelecimento.id_estab", ondelete="CASCADE")
    )
    url: Mapped[str] = mapped_column(String(500))
    legenda: Mapped[str | None] = mapped_column(String(255))
