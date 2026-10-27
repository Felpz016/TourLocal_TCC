from decimal import Decimal

from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session

import app.models  # noqa: F401
from app.db.base import Base
from app.importacao.osm import converter, montar_consulta, salvar
from app.models import Estabelecimento

RESTAURANTE = {
    "type": "node",
    "id": 101,
    "lat": -21.7946,
    "lon": -48.1756,
    "tags": {
        "amenity": "restaurant",
        "name": "Cantina Exemplo",
        "cuisine": "italian;pizza",
        "addr:street": "Avenida Exemplo",
        "addr:housenumber": "100",
        "wheelchair": "yes",
        "diet:vegetarian": "yes",
        "diet:vegan": "no",
        "opening_hours": "Tu-Su 11:00-15:00",
    },
}
PARQUE = {
    "type": "way",
    "id": 202,
    "center": {"lat": -21.79, "lon": -48.17},
    "tags": {"leisure": "park", "name": "Parque Exemplo"},
}


def test_converte_restaurante_com_endereco_horario_e_acessibilidade():
    lugar = converter(RESTAURANTE, "Araraquara")
    assert lugar.origem_externa == "osm:node/101"
    assert lugar.categoria == "Restaurante"
    assert lugar.endereco == "Avenida Exemplo, 100 - Araraquara"
    assert lugar.descricao == "Cozinha: italian, pizza"
    assert lugar.acessibilidade is True
    assert lugar.opcoes_alimentares == "vegetariano"
    assert lugar.latitude == Decimal("-21.794600")
    assert len(lugar.horarios) == 6


def test_converte_area_usando_o_ponto_central():
    lugar = converter(PARQUE, "Araraquara")
    assert lugar.categoria == "Parque"
    assert lugar.longitude == Decimal("-48.170000")
    assert lugar.horarios is None


def test_ignora_lugar_sem_nome_ou_categoria_conhecida():
    assert converter({**RESTAURANTE, "tags": {"amenity": "restaurant"}}, "X") is None
    assert converter({**RESTAURANTE, "tags": {"shop": "bakery", "name": "P"}}, "X") is None


def test_consulta_filtra_pela_cidade():
    assert 'area["name"="Araraquara"]' in montar_consulta("Araraquara")


def test_importar_duas_vezes_atualiza_sem_duplicar():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    lugares = [converter(RESTAURANTE, "Araraquara"), converter(PARQUE, "Araraquara")]
    with Session(engine) as db:
        assert salvar(db, lugares) == (2, 0)
        lugares[0].nome = "Cantina Exemplo (novo nome)"
        assert salvar(db, lugares) == (0, 2)
        assert db.scalar(select(func.count()).select_from(Estabelecimento)) == 2
        cantina = db.scalar(
            select(Estabelecimento).where(Estabelecimento.origem_externa == "osm:node/101")
        )
        assert cantina.nome == "Cantina Exemplo (novo nome)"
        assert cantina.verificado is True
        assert [c.nome for c in cantina.categorias] == ["Restaurante"]
        assert len(cantina.horarios) == 6
