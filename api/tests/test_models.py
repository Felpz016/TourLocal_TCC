from sqlalchemy import create_engine, inspect

import app.models  # noqa: F401  (registra todas as tabelas no metadata)
from app.db.base import Base


def test_modelo_cria_todas_as_tabelas_do_der():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    tabelas = set(inspect(engine).get_table_names())
    assert tabelas == {
        "usuario",
        "perfil",
        "estabelecimento",
        "categoria",
        "estab_categoria",
        "horario_funcionamento",
        "foto",
        "avaliacao",
        "favorito",
    }
