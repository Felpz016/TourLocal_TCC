"""Categorias padrão de cada eixo de recomendação."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Categoria
from app.models.enums import Eixo

CATEGORIAS_PADRAO: dict[str, Eixo] = {
    "Restaurante": Eixo.COMER,
    "Lanchonete": Eixo.COMER,
    "Cafeteria": Eixo.COMER,
    "Bar": Eixo.COMER,
    "Sorveteria": Eixo.COMER,
    "Hotel": Eixo.FICAR,
    "Pousada": Eixo.FICAR,
    "Hostel": Eixo.FICAR,
    "Motel": Eixo.FICAR,
    "Museu": Eixo.FAZER,
    "Parque": Eixo.FAZER,
    "Ponto turístico": Eixo.FAZER,
    "Mirante": Eixo.FAZER,
    "Teatro": Eixo.FAZER,
    "Cinema": Eixo.FAZER,
    "Centro cultural": Eixo.FAZER,
    "Galeria": Eixo.FAZER,
    "Zoológico": Eixo.FAZER,
}


def garantir_categorias(db: Session) -> dict[str, Categoria]:
    """Cria as categorias que faltam e devolve todas, indexadas pelo nome."""
    existentes = {c.nome: c for c in db.scalars(select(Categoria))}
    for nome, eixo in CATEGORIAS_PADRAO.items():
        if nome not in existentes:
            categoria = Categoria(nome=nome, eixo=eixo)
            db.add(categoria)
            existentes[nome] = categoria
    db.flush()
    return existentes
