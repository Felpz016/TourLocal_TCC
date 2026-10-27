"""Motor de recomendação (UC04).

Fase 1, filtragem espacial: retângulo em volta do usuário (usa o índice do banco) e
depois a distância exata pela fórmula de Haversine, mantendo só o que está no raio.
Fase 2, regras de negócio: só estabelecimentos verificados (RN01) e, salvo pedido
explícito, só os abertos agora (RN02).
Fase 3, ordenação: nesta versão, do mais próximo para o mais distante. A pontuação
ponderada (RN08) entra na Sprint 4.
"""

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.models import Avaliacao, Categoria, Estabelecimento
from app.models.enums import Eixo, StatusAvaliacao
from app.repositories import usuario_repository
from app.services import geo
from app.services.horario import esta_aberto

LIMITE_RESULTADOS = 50


@dataclass
class Candidato:
    estabelecimento: Estabelecimento
    distancia_km: float
    aberto_agora: bool | None
    nota_media: float | None = None
    total_avaliacoes: int = 0


def raio_do_usuario(db: Session, id_usuario: int, raio_pedido: float | None) -> float:
    """Raio pedido na consulta, senão o do perfil (RF03), senão o padrão (RN09); máx. 20 km."""
    if raio_pedido is None:
        perfil = usuario_repository.buscar_perfil(db, id_usuario)
        raio_pedido = float(perfil.raio_busca_km) if perfil else settings.raio_busca_padrao_km
    return min(raio_pedido, settings.raio_busca_maximo_km)


def filtrar_por_raio(
    db: Session, eixo: Eixo, lat: float, lon: float, raio_km: float
) -> list[tuple[Estabelecimento, float]]:
    """Fase 1. Já descarta os não verificados (RN01) na própria consulta."""
    lat_min, lat_max, lon_min, lon_max = geo.caixa_delimitadora(lat, lon, raio_km)
    consulta = (
        select(Estabelecimento)
        .join(Estabelecimento.categorias)
        .where(
            Categoria.eixo == eixo,
            Estabelecimento.verificado.is_(True),
            Estabelecimento.latitude.between(Decimal(str(lat_min)), Decimal(str(lat_max))),
            Estabelecimento.longitude.between(Decimal(str(lon_min)), Decimal(str(lon_max))),
        )
        .options(
            selectinload(Estabelecimento.categorias),
            selectinload(Estabelecimento.horarios),
            selectinload(Estabelecimento.fotos),
        )
        .distinct()
    )
    dentro_do_raio = []
    for estab in db.scalars(consulta):
        distancia = geo.haversine_km(lat, lon, float(estab.latitude), float(estab.longitude))
        if distancia <= raio_km:
            dentro_do_raio.append((estab, distancia))
    return dentro_do_raio


def aplicar_regras(
    candidatos: list[tuple[Estabelecimento, float]], agora: datetime, incluir_fechados: bool
) -> list[Candidato]:
    """Fase 2. Locais sem horário informado continuam na lista (aberto_agora = None)."""
    resultado = []
    for estab, distancia in candidatos:
        aberto = esta_aberto(estab.horarios, agora)
        if aberto is False and not incluir_fechados:
            continue
        resultado.append(Candidato(estab, distancia, aberto))
    return resultado


def _preencher_notas(db: Session, candidatos: list[Candidato]) -> None:
    ids = [c.estabelecimento.id_estab for c in candidatos]
    if not ids:
        return
    linhas = db.execute(
        select(Avaliacao.id_estab, func.avg(Avaliacao.nota), func.count())
        .where(Avaliacao.id_estab.in_(ids), Avaliacao.status == StatusAvaliacao.PUBLICADA)
        .group_by(Avaliacao.id_estab)
    )
    notas = {id_estab: (float(media), total) for id_estab, media, total in linhas}
    for c in candidatos:
        c.nota_media, c.total_avaliacoes = notas.get(c.estabelecimento.id_estab, (None, 0))


def recomendar(
    db: Session,
    id_usuario: int,
    eixo: Eixo,
    lat: float,
    lon: float,
    raio_km: float | None = None,
    incluir_fechados: bool = False,
    agora: datetime | None = None,
) -> tuple[float, list[Candidato]]:
    raio = raio_do_usuario(db, id_usuario, raio_km)
    agora = agora or datetime.now(ZoneInfo(settings.fuso_horario))

    candidatos = aplicar_regras(filtrar_por_raio(db, eixo, lat, lon, raio), agora, incluir_fechados)
    candidatos.sort(key=lambda c: c.distancia_km)
    candidatos = candidatos[:LIMITE_RESULTADOS]
    _preencher_notas(db, candidatos)
    return raio, candidatos


def minutos(distancia_km: float, velocidade_kmh: float) -> int:
    return max(1, round(distancia_km / velocidade_kmh * 60))
