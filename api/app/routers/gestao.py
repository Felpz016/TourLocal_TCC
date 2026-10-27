from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.core.config import settings
from app.core.deps import Comerciante, DbSession, UsuarioAtual
from app.schemas.estabelecimento import FotoOut
from app.schemas.gestao import EstabelecimentoIn, MeuEstabelecimentoOut
from app.services import estabelecimento_service, fotos
from app.services import gestao_service as servico

router = APIRouter(tags=["comerciante"])


def _erro(e: Exception) -> HTTPException:
    if isinstance(e, estabelecimento_service.NaoEncontrado):
        return HTTPException(status.HTTP_404_NOT_FOUND, "Não encontrado")
    if isinstance(e, estabelecimento_service.AcaoNaoPermitida):
        return HTTPException(status.HTTP_403_FORBIDDEN, str(e))
    return HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(e))


ERROS = (
    estabelecimento_service.NaoEncontrado,
    estabelecimento_service.AcaoNaoPermitida,
    servico.DadosInvalidos,
    fotos.FotoInvalida,
)


@router.get("/meus-estabelecimentos", response_model=list[MeuEstabelecimentoOut])
def listar(usuario: Comerciante, db: DbSession):
    """Locais cadastrados pelo comerciante, com a situação da verificação."""
    return servico.listar_do_responsavel(db, usuario)


@router.post("/estabelecimentos", status_code=status.HTTP_201_CREATED)
def cadastrar(dados: EstabelecimentoIn, usuario: Comerciante, db: DbSession) -> dict:
    """Cadastro pelo comerciante (RF15). Fica pendente até a verificação (RN01)."""
    try:
        estab = servico.criar(db, usuario, dados)
    except ERROS as e:
        raise _erro(e) from None
    return {"id_estab": estab.id_estab, "verificado": estab.verificado}


@router.put("/estabelecimentos/{id_estab}")
def atualizar(
    id_estab: int, dados: EstabelecimentoIn, usuario: UsuarioAtual, db: DbSession
) -> dict:
    """Atualiza dados, horários e fechamento temporário (RF16). Só o dono ou o admin (RN07)."""
    try:
        estab = servico.atualizar(db, id_estab, usuario, dados)
    except ERROS as e:
        raise _erro(e) from None
    return {"id_estab": estab.id_estab, "verificado": estab.verificado}


@router.post(
    "/estabelecimentos/{id_estab}/fotos",
    response_model=FotoOut,
    status_code=status.HTTP_201_CREATED,
)
def enviar_foto(
    id_estab: int,
    usuario: UsuarioAtual,
    db: DbSession,
    arquivo: Annotated[UploadFile, File(description="JPG, PNG ou WebP")],
    legenda: Annotated[str | None, Form(max_length=255)] = None,
):
    """Envio de foto (RF17), com limite de tamanho e de formato."""
    # Lê um byte além do limite: basta para saber se o arquivo passou do tamanho.
    conteudo = arquivo.file.read(settings.foto_tamanho_maximo_mb * 1024 * 1024 + 1)
    try:
        foto = servico.adicionar_foto(db, id_estab, usuario, conteudo, legenda)
    except ERROS as e:
        raise _erro(e) from None
    return FotoOut(id_foto=foto.id_foto, url=foto.url, legenda=foto.legenda)


@router.delete("/fotos/{id_foto}", status_code=status.HTTP_204_NO_CONTENT)
def remover_foto(id_foto: int, usuario: UsuarioAtual, db: DbSession) -> None:
    try:
        servico.remover_foto(db, id_foto, usuario)
    except ERROS as e:
        raise _erro(e) from None
