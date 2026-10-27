from datetime import datetime, time

from pydantic import BaseModel, Field

from app.models.enums import Eixo, FaixaPreco


class HorarioOut(BaseModel):
    dia_semana: int  # 0 = segunda-feira
    hora_abertura: time
    hora_fechamento: time


class FotoOut(BaseModel):
    id_foto: int
    url: str  # relativa ("/uploads/...") quando a foto foi enviada pelo comerciante
    legenda: str | None


class AvaliacaoOut(BaseModel):
    id_avaliacao: int
    autor: str
    nota: int
    comentario: str | None
    data_registro: datetime
    minha: bool


class EstabelecimentoDetalheOut(BaseModel):
    """Tela de detalhes (RF10)."""

    id_estab: int
    nome: str
    eixo: Eixo | None
    categorias: list[str]
    descricao: str | None
    endereco: str
    latitude: float
    longitude: float
    telefone: str | None
    site: str | None
    faixa_preco: FaixaPreco | None
    acessibilidade: bool
    opcoes_alimentares: list[str]
    horarios: list[HorarioOut]
    aberto_agora: bool | None
    fechado_temporariamente: bool
    verificado: bool
    pode_editar: bool
    fotos: list[FotoOut]
    nota_media: float | None
    total_avaliacoes: int
    distancia_km: float | None
    favorito: bool
    minha_avaliacao: AvaliacaoOut | None


class AvaliacaoIn(BaseModel):
    nota: int = Field(ge=1, le=5)
    comentario: str | None = Field(default=None, max_length=1000)


class FavoritoOut(BaseModel):
    id_estab: int
    nome: str
    categorias: list[str]
    endereco: str
    nota_media: float | None
    data_inclusao: datetime
