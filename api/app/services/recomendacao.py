"""Motor de recomendação (UC04), em três fases.

Fase 1, filtragem espacial: retângulo em volta do usuário (usa o índice do banco) e
depois a distância exata pela fórmula de Haversine, mantendo só o que está no raio.
Fase 2, regras de negócio e filtros: só verificados (RN01); só abertos agora, salvo
pedido (RN02); só acessíveis quando o turista precisa; e os filtros escolhidos na tela
(categoria, faixa de preço e nota mínima, RF09) e a busca por nome.
Fase 3, ranqueamento: pontuação ponderada (RN08, app/services/pontuacao.py), da maior
para a menor, com os motivos de cada recomendação (RF11).
"""

import unicodedata
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.models import Categoria, Estabelecimento, Foto, HorarioFuncionamento, Perfil
from app.models.enums import Eixo, FaixaPreco
from app.repositories import avaliacao_repository, usuario_repository
from app.services import geo
from app.services.horario import esta_aberto, proxima_mudanca
from app.services.pontuacao import Pontuacao, pontuar

LIMITE_RESULTADOS = 50


@dataclass
class Filtros:
    """Filtros adicionais da tela (RF09)."""

    categoria: str | None = None
    faixas_preco: list[FaixaPreco] = field(default_factory=list)
    nota_minima: float | None = None
    incluir_fechados: bool = False
    # Texto digitado na busca: procura no nome, nas categorias e no endereço.
    busca: str | None = None


@dataclass
class Candidato:
    estabelecimento: Estabelecimento
    distancia_km: float
    aberto_agora: bool | None
    # "Fecha às 23:00", "Abre às 18:00"... (None sem horário informado).
    muda_as: str | None = None
    nota_media: float | None = None
    total_avaliacoes: int = 0
    pontuacao: Pontuacao | None = None
    # Primeira foto do lugar, buscada só para os que entram na resposta.
    foto_url: str | None = None


def minutos(distancia_km: float, velocidade_kmh: float) -> int:
    return max(1, round(distancia_km / velocidade_kmh * 60))


def normalizar(texto: str) -> str:
    """Minúsculas e sem acentos, para "cafe" achar "Café" e "acai" achar "Açaí"."""
    sem_acento = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return " ".join(sem_acento.lower().split())


def combina_com_busca(estab: Estabelecimento, busca: str) -> bool:
    """Todas as palavras da busca precisam aparecer no nome, nas categorias ou no endereço."""
    texto = normalizar(" ".join([estab.nome, estab.endereco, *(c.nome for c in estab.categorias)]))
    return all(palavra in texto for palavra in normalizar(busca).split())


def raio_do_usuario(perfil: Perfil | None, raio_pedido: float | None) -> float:
    """Raio pedido na consulta, senão o do perfil (RF03), senão o padrão (RN09); máx. 20 km."""
    if raio_pedido is None:
        raio_pedido = float(perfil.raio_busca_km) if perfil else settings.raio_busca_padrao_km
    return min(raio_pedido, settings.raio_busca_maximo_km)


def dias_relevantes(agora: datetime) -> list[int]:
    """Ontem, hoje e amanhã: os únicos dias que "aberto agora" e "abre/fecha às" consultam.

    Ontem conta pelas faixas que passam da meia-noite; amanhã, pelo "Abre amanhã às".
    """
    return [(agora + timedelta(days=d)).weekday() for d in (-1, 0, 1)]


def filtrar_por_raio(
    db: Session, eixo: Eixo, lat: float, lon: float, raio_km: float, agora: datetime
) -> list[tuple[Estabelecimento, float, bool]]:
    """Fase 1. Já descarta os não verificados (RN01) na própria consulta.

    Para responder rápido com muitos lugares na área (RNF01), carrega só o que as fases
    seguintes usam: as categorias e os horários de ontem, hoje e amanhã. As fotos ficam para
    o fim, só dos lugares que entram na resposta (ver preencher_fotos). O terceiro valor de
    cada par diz se o lugar tem algum horário cadastrado na semana: sem ele, quem só abre em
    outros dias pareceria "sem horário informado" em vez de "fechado".
    """
    lat_min, lat_max, lon_min, lon_max = geo.caixa_delimitadora(lat, lon, raio_km)
    consulta = (
        select(Estabelecimento)
        .join(Estabelecimento.categorias)
        .where(
            Categoria.eixo == eixo,
            Estabelecimento.verificado.is_(True),
            # RF16: fechado temporariamente não aparece, nem com "incluir fechados".
            Estabelecimento.fechado_temporariamente.is_(False),
            Estabelecimento.latitude.between(Decimal(str(lat_min)), Decimal(str(lat_max))),
            Estabelecimento.longitude.between(Decimal(str(lon_min)), Decimal(str(lon_max))),
        )
        .options(
            selectinload(Estabelecimento.categorias),
            # A lista de horários fica parcial nestes objetos, que são só de leitura nesta
            # requisição; o detalhe e a gestão carregam a semana inteira.
            selectinload(
                Estabelecimento.horarios.and_(
                    HorarioFuncionamento.dia_semana.in_(dias_relevantes(agora))
                )
            ),
        )
        .distinct()
    )
    dentro_do_raio = []
    for estab in db.scalars(consulta):
        distancia = geo.haversine_km(lat, lon, float(estab.latitude), float(estab.longitude))
        if distancia <= raio_km:
            dentro_do_raio.append((estab, distancia))
    com_horario = _com_algum_horario(db, [estab.id_estab for estab, _ in dentro_do_raio])
    return [(e, d, e.id_estab in com_horario) for e, d in dentro_do_raio]


def _com_algum_horario(db: Session, ids_estab: list[int]) -> set[int]:
    """Quais desses lugares têm horário cadastrado em algum dia da semana."""
    if not ids_estab:
        return set()
    return set(
        db.scalars(
            select(HorarioFuncionamento.id_estab)
            .where(HorarioFuncionamento.id_estab.in_(ids_estab))
            .distinct()
        )
    )


def aplicar_regras(
    candidatos: list[tuple[Estabelecimento, float, bool]],
    agora: datetime,
    filtros: Filtros,
    perfil: Perfil | None,
) -> list[Candidato]:
    """Fase 2, exceto a nota mínima, que depende das notas calculadas depois."""
    precisa_acessibilidade = bool(perfil and perfil.necessita_acessibilidade)
    # Quem procura um lugar pelo nome quer achá-lo mesmo fechado; o cartão mostra "Fechado".
    incluir_fechados = filtros.incluir_fechados or bool(filtros.busca)
    resultado = []
    for estab, distancia, com_horario in candidatos:
        if precisa_acessibilidade and not estab.acessibilidade:
            continue
        if filtros.busca and not combina_com_busca(estab, filtros.busca):
            continue
        if filtros.categoria and filtros.categoria not in {c.nome for c in estab.categorias}:
            continue
        if filtros.faixas_preco and estab.faixa_preco not in filtros.faixas_preco:
            continue
        # Lugares sem horário informado continuam na lista (aberto_agora = None).
        aberto = esta_aberto(estab.horarios, agora)
        if aberto is None and com_horario:
            aberto = False  # só abre em outros dias da semana
        if aberto is False and not incluir_fechados:
            continue
        resultado.append(
            Candidato(estab, distancia, aberto, proxima_mudanca(estab.horarios, agora, aberto))
        )
    return resultado


def _preencher_notas(db: Session, candidatos: list[Candidato]) -> None:
    notas = avaliacao_repository.notas_medias(db, [c.estabelecimento.id_estab for c in candidatos])
    for c in candidatos:
        c.nota_media, c.total_avaliacoes = notas.get(c.estabelecimento.id_estab, (None, 0))


def preencher_fotos(db: Session, candidatos: list[Candidato]) -> None:
    """Primeira foto (a de menor id) de cada lugar, numa consulta só."""
    if not candidatos:
        return
    primeiras = (
        select(func.min(Foto.id_foto))
        .where(Foto.id_estab.in_([c.estabelecimento.id_estab for c in candidatos]))
        .group_by(Foto.id_estab)
    )
    urls = dict(
        db.execute(select(Foto.id_estab, Foto.url).where(Foto.id_foto.in_(primeiras))).all()
    )
    for c in candidatos:
        c.foto_url = urls.get(c.estabelecimento.id_estab)


def recomendar(
    db: Session,
    id_usuario: int,
    eixo: Eixo,
    lat: float,
    lon: float,
    raio_km: float | None = None,
    filtros: Filtros | None = None,
    agora: datetime | None = None,
) -> tuple[float, list[Candidato]]:
    filtros = filtros or Filtros()
    perfil = usuario_repository.buscar_perfil(db, id_usuario)
    # Na busca por nome o raio padrão é a cidade inteira (o máximo), não o do perfil.
    if filtros.busca and raio_km is None:
        raio_km = settings.raio_busca_maximo_km
    raio = raio_do_usuario(perfil, raio_km)
    agora = agora or datetime.now(ZoneInfo(settings.fuso_horario))

    candidatos = aplicar_regras(
        filtrar_por_raio(db, eixo, lat, lon, raio, agora), agora, filtros, perfil
    )
    _preencher_notas(db, candidatos)
    if filtros.nota_minima is not None:
        candidatos = [
            c
            for c in candidatos
            if c.nota_media is not None and c.nota_media >= filtros.nota_minima
        ]

    for c in candidatos:
        c.pontuacao = pontuar(
            c.estabelecimento,
            c.distancia_km,
            raio,
            c.nota_media,
            minutos(c.distancia_km, settings.velocidade_a_pe_kmh),
            perfil,
            eixo_comer=eixo == Eixo.COMER,
        )
    candidatos.sort(key=lambda c: (-c.pontuacao.total, c.distancia_km))
    candidatos = candidatos[:LIMITE_RESULTADOS]
    preencher_fotos(db, candidatos)
    return raio, candidatos
