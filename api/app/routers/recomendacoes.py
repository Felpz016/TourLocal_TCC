from typing import Annotated

from fastapi import APIRouter, Query

from app.core.config import settings
from app.core.deps import DbSession, UsuarioAtual
from app.models.enums import Eixo
from app.schemas.recomendacao import RecomendacaoOut, RecomendacoesOut
from app.services import recomendacao

router = APIRouter(prefix="/recomendacoes", tags=["recomendações"])


@router.get("", response_model=RecomendacoesOut)
def listar(
    usuario: UsuarioAtual,
    db: DbSession,
    eixo: Eixo,
    lat: Annotated[float, Query(ge=-90, le=90)],
    lng: Annotated[float, Query(ge=-180, le=180)],
    raio_km: Annotated[float | None, Query(gt=0, le=settings.raio_busca_maximo_km)] = None,
    incluir_fechados: bool = False,
):
    """Estabelecimentos próximos de um eixo (Comer, Ficar ou Fazer), do mais perto ao mais longe.

    As coordenadas chegam pela consulta e não são gravadas (RN10).
    """
    raio, candidatos = recomendacao.recomendar(
        db, usuario.id_usuario, eixo, lat, lng, raio_km, incluir_fechados
    )
    return RecomendacoesOut(
        raio_km=raio,
        resultados=[
            RecomendacaoOut(
                id_estab=c.estabelecimento.id_estab,
                nome=c.estabelecimento.nome,
                eixo=eixo,
                categorias=[cat.nome for cat in c.estabelecimento.categorias],
                endereco=c.estabelecimento.endereco,
                latitude=float(c.estabelecimento.latitude),
                longitude=float(c.estabelecimento.longitude),
                faixa_preco=c.estabelecimento.faixa_preco,
                acessibilidade=c.estabelecimento.acessibilidade,
                nota_media=round(c.nota_media, 1) if c.nota_media is not None else None,
                total_avaliacoes=c.total_avaliacoes,
                foto_url=c.estabelecimento.fotos[0].url if c.estabelecimento.fotos else None,
                distancia_km=round(c.distancia_km, 2),
                minutos_a_pe=recomendacao.minutos(c.distancia_km, settings.velocidade_a_pe_kmh),
                minutos_de_carro=recomendacao.minutos(
                    c.distancia_km, settings.velocidade_carro_kmh
                ),
                aberto_agora=c.aberto_agora,
            )
            for c in candidatos
        ],
    )
