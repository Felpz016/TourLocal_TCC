from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.core.deps import DbSession, Turista, UsuarioAtual
from app.schemas.estabelecimento import (
    AvaliacaoIn,
    AvaliacaoOut,
    EstabelecimentoDetalheOut,
    FavoritoOut,
)
from app.services import estabelecimento_service as servico

router = APIRouter(tags=["estabelecimentos"])


def _erro(e: Exception) -> HTTPException:
    if isinstance(e, servico.NaoEncontrado):
        return HTTPException(status.HTTP_404_NOT_FOUND, "Não encontrado")
    return HTTPException(status.HTTP_403_FORBIDDEN, str(e))


@router.get("/estabelecimentos/{id_estab}", response_model=EstabelecimentoDetalheOut)
def detalhar(
    id_estab: int,
    usuario: UsuarioAtual,
    db: DbSession,
    lat: Annotated[float | None, Query(ge=-90, le=90)] = None,
    lng: Annotated[float | None, Query(ge=-180, le=180)] = None,
):
    """Detalhes do local (RF10). Com lat/lng, inclui a distância até o usuário."""
    try:
        return servico.detalhar(db, id_estab, usuario, lat, lng)
    except servico.NaoEncontrado as e:
        raise _erro(e) from None


@router.get("/estabelecimentos/{id_estab}/avaliacoes", response_model=list[AvaliacaoOut])
def listar_avaliacoes(id_estab: int, usuario: UsuarioAtual, db: DbSession):
    try:
        return servico.listar_avaliacoes(db, id_estab, usuario)
    except servico.NaoEncontrado as e:
        raise _erro(e) from None


@router.put("/estabelecimentos/{id_estab}/avaliacao", response_model=AvaliacaoOut)
def avaliar(id_estab: int, dados: AvaliacaoIn, usuario: Turista, db: DbSession):
    """Cria ou edita a avaliação do turista, de 1 a 5 com comentário (RF13, RN04)."""
    try:
        return servico.avaliar(db, id_estab, usuario, dados.nota, dados.comentario)
    except (servico.NaoEncontrado, servico.AcaoNaoPermitida) as e:
        raise _erro(e) from None


@router.delete("/estabelecimentos/{id_estab}/avaliacao", status_code=status.HTTP_204_NO_CONTENT)
def excluir_avaliacao(id_estab: int, usuario: Turista, db: DbSession) -> None:
    try:
        servico.excluir_avaliacao(db, id_estab, usuario)
    except servico.NaoEncontrado as e:
        raise _erro(e) from None


@router.post("/avaliacoes/{id_avaliacao}/denuncia", status_code=status.HTTP_204_NO_CONTENT)
def denunciar(id_avaliacao: int, usuario: UsuarioAtual, db: DbSession) -> None:
    """Denuncia uma avaliação; ela fica oculta até a moderação (RN06)."""
    try:
        servico.denunciar(db, id_avaliacao, usuario)
    except (servico.NaoEncontrado, servico.AcaoNaoPermitida) as e:
        raise _erro(e) from None


@router.get("/favoritos", response_model=list[FavoritoOut])
def listar_favoritos(usuario: Turista, db: DbSession):
    """Locais salvos pelo turista (RF14)."""
    return servico.listar_favoritos(db, usuario)


@router.put("/favoritos/{id_estab}", status_code=status.HTTP_204_NO_CONTENT)
def favoritar(id_estab: int, usuario: Turista, db: DbSession) -> None:
    try:
        servico.favoritar(db, id_estab, usuario)
    except servico.NaoEncontrado as e:
        raise _erro(e) from None


@router.delete("/favoritos/{id_estab}", status_code=status.HTTP_204_NO_CONTENT)
def desfavoritar(id_estab: int, usuario: Turista, db: DbSession) -> None:
    servico.desfavoritar(db, id_estab, usuario)
