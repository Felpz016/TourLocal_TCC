"""Perfil de preferências do turista (UC02: RF03)."""

from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Perfil
from app.repositories import usuario_repository
from app.schemas.perfil import PerfilIn, PerfilOut


def _para_saida(perfil: Perfil | None) -> PerfilOut:
    if perfil is None:
        # RN09: sem preferências declaradas, valem os padrões (raio de 3 km).
        return PerfilOut()
    return PerfilOut(
        faixa_orcamento=perfil.faixa_orcamento,
        restricoes_alimentares=[r for r in (perfil.restricoes_alimentares or "").split(",") if r],
        necessita_acessibilidade=perfil.necessita_acessibilidade,
        tempo_disponivel_min=perfil.tempo_disponivel_min,
        raio_busca_km=perfil.raio_busca_km,
    )


def obter(db: Session, id_usuario: int) -> PerfilOut:
    return _para_saida(usuario_repository.buscar_perfil(db, id_usuario))


def salvar(db: Session, id_usuario: int, dados: PerfilIn) -> PerfilOut:
    perfil = usuario_repository.buscar_perfil(db, id_usuario)
    if perfil is None:
        perfil = Perfil(id_usuario=id_usuario)
        db.add(perfil)

    restricoes = sorted({r.strip().lower() for r in dados.restricoes_alimentares if r.strip()})
    perfil.faixa_orcamento = dados.faixa_orcamento
    perfil.restricoes_alimentares = ",".join(restricoes) or None
    perfil.necessita_acessibilidade = dados.necessita_acessibilidade
    perfil.tempo_disponivel_min = dados.tempo_disponivel_min
    perfil.raio_busca_km = min(dados.raio_busca_km, Decimal(str(settings.raio_busca_maximo_km)))
    db.commit()
    db.refresh(perfil)
    return _para_saida(perfil)
