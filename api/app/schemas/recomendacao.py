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
    opcoes_alimentares: list[str]
    nota_media: float | None
    total_avaliacoes: int
    foto_url: str | None
    # RF08: distância e tempo estimado de deslocamento.
    distancia_km: float
    minutos_a_pe: int
    minutos_de_carro: int
    # None quando o estabelecimento não informou horários.
    aberto_agora: bool | None
    # Complemento do aberto/fechado: "Fecha às 23:00", "Abre às 18:00" (None sem horário).
    muda_as: str | None = None
    # RN08 e RF11: pontuação de 0 a 1, nota de cada critério e os motivos em texto.
    pontuacao: float
    criterios: dict[str, float]
    motivos: list[str]


class RecomendacoesOut(BaseModel):
    raio_km: float
    resultados: list[RecomendacaoOut]
    # Exceção E1 do UC04: quando nada é encontrado, o raio maior a sugerir (ou None).
    raio_sugerido_km: float | None = None


class CategoriaOut(BaseModel):
    nome: str
    eixo: Eixo
