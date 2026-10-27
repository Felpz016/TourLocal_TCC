from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Perfil, Usuario


def buscar_por_email(db: Session, email: str) -> Usuario | None:
    return db.scalar(select(Usuario).where(Usuario.email == email))


def buscar_por_id(db: Session, id_usuario: int) -> Usuario | None:
    return db.get(Usuario, id_usuario)


def buscar_perfil(db: Session, id_usuario: int) -> Perfil | None:
    return db.scalar(select(Perfil).where(Perfil.id_usuario == id_usuario))
