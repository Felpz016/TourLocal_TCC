from fastapi import APIRouter

from app.core.deps import DbSession, Turista
from app.schemas.perfil import PerfilIn, PerfilOut
from app.services import perfil_service

router = APIRouter(prefix="/perfil", tags=["perfil de preferências"])


@router.get("", response_model=PerfilOut)
def obter_perfil(usuario: Turista, db: DbSession):
    return perfil_service.obter(db, usuario.id_usuario)


@router.put("", response_model=PerfilOut)
def salvar_perfil(dados: PerfilIn, usuario: Turista, db: DbSession):
    return perfil_service.salvar(db, usuario.id_usuario, dados)
