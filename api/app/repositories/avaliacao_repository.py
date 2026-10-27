from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Avaliacao
from app.models.enums import StatusAvaliacao


def notas_medias(db: Session, ids_estab: list[int]) -> dict[int, tuple[float, int]]:
    """{id_estab: (média, total)} considerando só avaliações publicadas (RN05, RN06)."""
    if not ids_estab:
        return {}
    linhas = db.execute(
        select(Avaliacao.id_estab, func.avg(Avaliacao.nota), func.count())
        .where(Avaliacao.id_estab.in_(ids_estab), Avaliacao.status == StatusAvaliacao.PUBLICADA)
        .group_by(Avaliacao.id_estab)
    )
    return {id_estab: (float(media), total) for id_estab, media, total in linhas}


def buscar_do_usuario(db: Session, id_usuario: int, id_estab: int) -> Avaliacao | None:
    return db.scalar(
        select(Avaliacao).where(Avaliacao.id_usuario == id_usuario, Avaliacao.id_estab == id_estab)
    )
