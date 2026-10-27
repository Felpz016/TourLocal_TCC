from pydantic import BaseModel

from app.models.enums import Eixo, FaixaPreco


class RecomendacaoOut(BaseModel):
    id_estab: int
    nome: str
    eixo: Eixo
    categorias: list[str]
    endereco: str
    latitude: float
    longitude: float
    faixa_preco: FaixaPreco | None
    acessibilidade: bool
    nota_media: float | None
    total_avaliacoes: int
    foto_url: str | None
    # RF08: distância e tempo estimado de deslocamento.
    distancia_km: float
    minutos_a_pe: int
    minutos_de_carro: int
    # None quando o estabelecimento não informou horários.
    aberto_agora: bool | None


class RecomendacoesOut(BaseModel):
    raio_km: float
    resultados: list[RecomendacaoOut]
