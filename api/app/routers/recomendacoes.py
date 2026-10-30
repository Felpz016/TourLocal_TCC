from typing import Annotated

from fastapi import APIRouter, Query
from sqlalchemy import select

from app.core.config import settings
from app.core.deps import DbSession, UsuarioAtual
from app.models import Categoria
from app.models.enums import Eixo, FaixaPreco
from app.schemas.recomendacao import CategoriaOut, RecomendacaoOut, RecomendacoesOut
from app.services import pontuacao, recomendacao

router = APIRouter(tags=["recomendações"])


@router.get("/recomendacoes", response_model=RecomendacoesOut)
def listar(
    usuario: UsuarioAtual,
    db: DbSession,
    eixo: Eixo,
    lat: Annotated[float, Query(ge=-90, le=90)],
    lng: Annotated[float, Query(ge=-180, le=180)],
    raio_km: Annotated[float | None, Query(gt=0, le=settings.raio_busca_maximo_km)] = None,
    categoria: str | None = None,
    faixa_preco: Annotated[list[FaixaPreco] | None, Query()] = None,
    nota_minima: Annotated[float | None, Query(ge=1, le=5)] = None,
    incluir_fechados: bool = False,
    busca: Annotated[str | None, Query(max_length=60)] = None,
):
    """Estabelecimentos recomendados de um eixo, da maior para a menor pontuação.

    As coordenadas chegam pela consulta e não são gravadas (RN10). Com `busca`, só ficam os
    lugares cujo nome, categoria ou endereço contém as palavras digitadas.
    """
    filtros = recomendacao.Filtros(
        categoria=categoria,
        faixas_preco=faixa_preco or [],
        nota_minima=nota_minima,
        incluir_fechados=incluir_fechados,
        busca=(busca or "").strip() or None,
    )
    raio, candidatos = recomendacao.recomendar(
        db, usuario.id_usuario, eixo, lat, lng, raio_km, filtros
    )

    raio_sugerido = None
    if not candidatos and raio < settings.raio_busca_maximo_km:
        raio_sugerido = min(raio * 2, settings.raio_busca_maximo_km)

    return RecomendacoesOut(
        raio_km=raio,
        raio_sugerido_km=raio_sugerido,
        resultados=[_saida(c, eixo) for c in candidatos],
    )


def _saida(c: recomendacao.Candidato, eixo: Eixo) -> RecomendacaoOut:
    estab = c.estabelecimento
    return RecomendacaoOut(
        id_estab=estab.id_estab,
        nome=estab.nome,
        eixo=eixo,
        categorias=[cat.nome for cat in estab.categorias],
        endereco=estab.endereco,
        latitude=float(estab.latitude),
        longitude=float(estab.longitude),
        faixa_preco=estab.faixa_preco,
        acessibilidade=estab.acessibilidade,
        opcoes_alimentares=sorted(pontuacao.opcoes(estab)),
        nota_media=round(c.nota_media, 1) if c.nota_media is not None else None,
        total_avaliacoes=c.total_avaliacoes,
        foto_url=estab.fotos[0].url if estab.fotos else None,
        distancia_km=round(c.distancia_km, 2),
        minutos_a_pe=recomendacao.minutos(c.distancia_km, settings.velocidade_a_pe_kmh),
        minutos_de_carro=recomendacao.minutos(c.distancia_km, settings.velocidade_carro_kmh),
        aberto_agora=c.aberto_agora,
        muda_as=c.muda_as,
        pontuacao=c.pontuacao.total,
        criterios={k: round(v, 3) for k, v in c.pontuacao.criterios.items()},
        motivos=c.pontuacao.motivos,
    )


@router.get("/categorias", response_model=list[CategoriaOut])
def listar_categorias(_: UsuarioAtual, db: DbSession, eixo: Eixo | None = None):
    """Categorias disponíveis, para os filtros da tela."""
    consulta = select(Categoria).order_by(Categoria.nome)
    if eixo:
        consulta = consulta.where(Categoria.eixo == eixo)
    return [CategoriaOut(nome=c.nome, eixo=c.eixo) for c in db.scalars(consulta)]
