from fastapi import APIRouter, HTTPException, status

from app.core.deps import Administrador, DbSession
from app.schemas.gestao import DecisaoDenuncia, DenunciaOut, PendenteOut
from app.services import estabelecimento_service
from app.services import gestao_service as servico

# Moderação (UC12, RF18): todas as rotas exigem conta de administrador.
router = APIRouter(prefix="/admin", tags=["administração"])


def _nao_encontrado() -> HTTPException:
    return HTTPException(status.HTTP_404_NOT_FOUND, "Não encontrado")


@router.get("/estabelecimentos/pendentes", response_model=list[PendenteOut])
def pendentes(_: Administrador, db: DbSession):
    return servico.listar_pendentes(db)


@router.post("/estabelecimentos/{id_estab}/aprovar", status_code=status.HTTP_204_NO_CONTENT)
def aprovar(id_estab: int, _: Administrador, db: DbSession) -> None:
    """Marca o cadastro como verificado; a partir daí ele entra nas recomendações (RN01)."""
    try:
        servico.aprovar(db, id_estab)
    except estabelecimento_service.NaoEncontrado:
        raise _nao_encontrado() from None


@router.delete("/estabelecimentos/{id_estab}", status_code=status.HTTP_204_NO_CONTENT)
def rejeitar(id_estab: int, _: Administrador, db: DbSession) -> None:
    try:
        servico.rejeitar(db, id_estab)
    except estabelecimento_service.NaoEncontrado:
        raise _nao_encontrado() from None
    except estabelecimento_service.AcaoNaoPermitida as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e)) from None


@router.get("/avaliacoes/denunciadas", response_model=list[DenunciaOut])
def denunciadas(_: Administrador, db: DbSession):
    return servico.listar_denunciadas(db)


@router.post("/avaliacoes/{id_avaliacao}/decisao", status_code=status.HTTP_204_NO_CONTENT)
def decidir(id_avaliacao: int, decisao: DecisaoDenuncia, _: Administrador, db: DbSession) -> None:
    """Mantém (volta a ser publicada) ou remove a avaliação denunciada (RN06)."""
    try:
        servico.decidir_denuncia(db, id_avaliacao, decisao.manter)
    except estabelecimento_service.NaoEncontrado:
        raise _nao_encontrado() from None
