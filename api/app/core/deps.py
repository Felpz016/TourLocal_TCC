"""Dependências reutilizadas pelas rotas: usuário logado e controle por tipo de conta."""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import ler_token_acesso
from app.db.session import get_db
from app.models import Usuario
from app.models.enums import TipoUsuario
from app.repositories import usuario_repository

DbSession = Annotated[Session, Depends(get_db)]

_bearer = HTTPBearer(auto_error=False)


def usuario_atual(
    db: DbSession,
    credenciais: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> Usuario:
    nao_autenticado = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não autenticado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credenciais is None:
        raise nao_autenticado
    id_usuario = ler_token_acesso(credenciais.credentials)
    usuario = usuario_repository.buscar_por_id(db, id_usuario) if id_usuario else None
    if usuario is None:
        raise nao_autenticado
    return usuario


UsuarioAtual = Annotated[Usuario, Depends(usuario_atual)]


def exigir_turista(usuario: UsuarioAtual) -> Usuario:
    if usuario.tipo != TipoUsuario.TURISTA:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Disponível apenas para turistas")
    return usuario


Turista = Annotated[Usuario, Depends(exigir_turista)]
