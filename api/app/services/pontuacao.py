"""Fase 3 do motor de recomendação: pontuação ponderada (RN08) e motivos (RF11).

Cada critério vira uma nota de 0 a 1, e a pontuação final é a soma ponderada:

    pontuação = p1·proximidade + p2·avaliação + p3·orçamento + p4·perfil

com p1 + p2 + p3 + p4 = 1 (pesos em app/core/config.py). Quando falta informação
para um critério (lugar sem avaliações, sem faixa de preço, turista sem preferências),
ele recebe 0,5: não ajuda nem atrapalha o lugar.
"""

from dataclasses import dataclass, field

from app.core.config import settings
from app.models import Estabelecimento, Perfil
from app.models.enums import FaixaPreco

NEUTRO = 0.5
NIVEL_PRECO = {FaixaPreco.ECONOMICO: 0, FaixaPreco.MODERADO: 1, FaixaPreco.ALTO: 2}
NOME_DIETA = {
    "vegetariano": "opção vegetariana",
    "vegano": "opção vegana",
    "sem_gluten": "opção sem glúten",
    "sem_lactose": "opção sem lactose",
}


@dataclass(frozen=True)
class Pesos:
    proximidade: float
    avaliacao: float
    orcamento: float
    perfil: float

    def __post_init__(self):
        total = self.proximidade + self.avaliacao + self.orcamento + self.perfil
        if abs(total - 1) > 1e-6:
            raise ValueError(f"Os pesos precisam somar 1 (somam {total})")


def pesos_padrao() -> Pesos:
    return Pesos(
        settings.peso_proximidade,
        settings.peso_avaliacao,
        settings.peso_orcamento,
        settings.peso_perfil,
    )


@dataclass
class Pontuacao:
    total: float
    criterios: dict[str, float]
    motivos: list[str] = field(default_factory=list)


def nota_proximidade(distancia_km: float, raio_km: float) -> float:
    return max(0.0, 1 - distancia_km / raio_km)


def nota_avaliacao(nota_media: float | None) -> float:
    return NEUTRO if nota_media is None else (nota_media - 1) / 4


def nota_orcamento(estab: FaixaPreco | None, desejada: FaixaPreco | None) -> float:
    if estab is None or desejada is None:
        return NEUTRO
    diferenca = NIVEL_PRECO[estab] - NIVEL_PRECO[desejada]
    # Mais barato que o orçamento ainda é bom; mais caro perde pontos a cada nível.
    if diferenca <= 0:
        return 1.0
    return 0.3 if diferenca == 1 else 0.0


def restricoes(perfil: Perfil | None) -> set[str]:
    if not perfil or not perfil.restricoes_alimentares:
        return set()
    return set(perfil.restricoes_alimentares.split(","))


def opcoes(estab: Estabelecimento) -> set[str]:
    return set(estab.opcoes_alimentares.split(",")) if estab.opcoes_alimentares else set()


def nota_perfil(
    estab: Estabelecimento, perfil: Perfil | None, minutos_a_pe: int, eixo_comer: bool
) -> float:
    """Aderência ao perfil: média dos critérios que o turista preencheu."""
    if perfil is None:
        return NEUTRO
    notas = []
    exigidas = restricoes(perfil)
    if exigidas and eixo_comer:
        notas.append(len(exigidas & opcoes(estab)) / len(exigidas))
    if perfil.tempo_disponivel_min:
        # Ida a pé de até 1/4 do tempo disponível vale 1; a partir de metade vale 0.
        fracao = minutos_a_pe / perfil.tempo_disponivel_min
        notas.append(min(1.0, max(0.0, (0.5 - fracao) / 0.25)))
    if perfil.necessita_acessibilidade:
        notas.append(1.0 if estab.acessibilidade else 0.0)
    return sum(notas) / len(notas) if notas else NEUTRO


def pontuar(
    estab: Estabelecimento,
    distancia_km: float,
    raio_km: float,
    nota_media: float | None,
    minutos_a_pe: int,
    perfil: Perfil | None,
    eixo_comer: bool,
    pesos: Pesos | None = None,
) -> Pontuacao:
    pesos = pesos or pesos_padrao()
    criterios = {
        "proximidade": nota_proximidade(distancia_km, raio_km),
        "avaliacao": nota_avaliacao(nota_media),
        "orcamento": nota_orcamento(estab.faixa_preco, perfil.faixa_orcamento if perfil else None),
        "perfil": nota_perfil(estab, perfil, minutos_a_pe, eixo_comer),
    }
    total = (
        pesos.proximidade * criterios["proximidade"]
        + pesos.avaliacao * criterios["avaliacao"]
        + pesos.orcamento * criterios["orcamento"]
        + pesos.perfil * criterios["perfil"]
    )
    return Pontuacao(
        round(total, 4),
        criterios,
        _motivos(estab, distancia_km, nota_media, perfil, minutos_a_pe, eixo_comer, criterios),
    )


def _motivos(
    estab: Estabelecimento,
    distancia_km: float,
    nota_media: float | None,
    perfil: Perfil | None,
    minutos_a_pe: int,
    eixo_comer: bool,
    criterios: dict[str, float],
) -> list[str]:
    """Frases curtas que explicam por que o lugar foi recomendado (RF11)."""
    motivos = []
    if criterios["proximidade"] >= 0.6:
        motivos.append(f"A {minutos_a_pe} min a pé de você")
    if nota_media is not None and nota_media >= 4:
        motivos.append(f"Bem avaliado (nota {nota_media:.1f})".replace(".", ","))
    if perfil and perfil.faixa_orcamento and criterios["orcamento"] == 1.0:
        motivos.append("Dentro do seu orçamento")
    if eixo_comer:
        for dieta in sorted(restricoes(perfil) & opcoes(estab)):
            motivos.append(f"Tem {NOME_DIETA.get(dieta, dieta)}")
    if perfil and perfil.necessita_acessibilidade and estab.acessibilidade:
        motivos.append("Acessível para cadeira de rodas")
    if not motivos:
        motivos.append(f"A {distancia_km:.1f} km de você".replace(".", ","))
    return motivos
