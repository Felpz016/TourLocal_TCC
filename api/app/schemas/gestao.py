from datetime import datetime, time
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.models.enums import FaixaPreco

OpcaoAlimentar = Literal["vegetariano", "vegano", "sem_gluten", "sem_lactose"]


class HorarioIn(BaseModel):
    dia_semana: int = Field(ge=0, le=6)  # 0 = segunda-feira
    hora_abertura: time
    hora_fechamento: time  # menor que a abertura = passa da meia-noite


class EstabelecimentoIn(BaseModel):
    """Cadastro e edição feitos pelo comerciante (RF15, RF16)."""

    nome: str = Field(min_length=2, max_length=150)
    descricao: str | None = Field(default=None, max_length=2000)
    endereco: str = Field(min_length=3, max_length=255)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    categorias: list[str] = Field(min_length=1, max_length=3)
    faixa_preco: FaixaPreco | None = None
    acessibilidade: bool = False
    opcoes_alimentares: list[OpcaoAlimentar] = []
    telefone: str | None = Field(default=None, max_length=40)
    site: str | None = Field(default=None, max_length=255)
    horarios: list[HorarioIn] = Field(default=[], max_length=21)
    fechado_temporariamente: bool = False

    @field_validator("nome", "endereco")
    @classmethod
    def _sem_espacos_nas_pontas(cls, valor: str) -> str:
        return valor.strip()

    @field_validator("descricao", "telefone", "site")
    @classmethod
    def _vazio_vira_nulo(cls, valor: str | None) -> str | None:
        return (valor or "").strip() or None

    @field_validator("site")
    @classmethod
    def _site_com_protocolo(cls, valor: str | None) -> str | None:
        if valor and not valor.startswith(("http://", "https://")):
            return f"https://{valor}"
        return valor


class MeuEstabelecimentoOut(BaseModel):
    id_estab: int
    nome: str
    endereco: str
    categorias: list[str]
    verificado: bool
    fechado_temporariamente: bool
    total_fotos: int


class PendenteOut(BaseModel):
    id_estab: int
    nome: str
    endereco: str
    categorias: list[str]
    responsavel: str | None
    email_responsavel: str | None


class DenunciaOut(BaseModel):
    id_avaliacao: int
    id_estab: int
    estabelecimento: str
    autor: str
    nota: int
    comentario: str | None
    data_registro: datetime


class DecisaoDenuncia(BaseModel):
    manter: bool  # True = volta a ser publicada; False = removida
