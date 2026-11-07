"""RN10 e RNF07: a localização do turista é usada na consulta e não fica guardada."""

import logging
from decimal import Decimal

from sqlalchemy import inspect, select, text

from app.core.privacidade import FiltroDeLocalizacao, ocultar_localizacao
from app.models import Estabelecimento
from app.services import geocodificacao
from app.services.categorias import garantir_categorias
from tests.conftest import cadastrar_e_logar

# Posição "do turista" com dígitos fáceis de reconhecer se vazarem para algum lugar.
LAT, LNG = "-21.793817", "-48.174123"


def test_ocultar_localizacao_esconde_lat_lng_e_endereco():
    caminho = "/recomendacoes?eixo=comer&lat=-21.793817&lng=-48.174123&raio_km=5"
    assert ocultar_localizacao(caminho) == "/recomendacoes?eixo=comer&lat=***&lng=***&raio_km=5"
    assert (
        ocultar_localizacao("/localizacao/geocodificar?endereco=Rua%20Um%2C%20123")
        == "/localizacao/geocodificar?endereco=***"
    )
    # Parâmetros que só contêm "lat" no nome não são tocados.
    assert ocultar_localizacao("/x?latitude_ok=1&plat=2") == "/x?latitude_ok=1&plat=2"


def test_log_de_acesso_nao_guarda_a_posicao():
    # Mesmo formato de linha que o uvicorn usa no logger "uvicorn.access".
    registro = logging.LogRecord(
        "uvicorn.access",
        logging.INFO,
        __file__,
        1,
        '%s - "%s %s HTTP/%s" %d',
        ("10.0.0.7:5050", "GET", f"/estabelecimentos/3?lat={LAT}&lng={LNG}", "1.1", 200),
        None,
    )
    assert FiltroDeLocalizacao().filter(registro) is True
    linha = registro.getMessage()
    assert "793817" not in linha and "174123" not in linha
    assert linha == '10.0.0.7:5050 - "GET /estabelecimentos/3?lat=***&lng=*** HTTP/1.1" 200'


def test_filtro_esta_ligado_no_log_de_acesso():
    import app.main  # noqa: F401  (o filtro é instalado ao carregar a API)

    filtros = logging.getLogger("uvicorn.access").filters
    assert any(isinstance(f, FiltroDeLocalizacao) for f in filtros)


def test_consultas_nao_gravam_a_posicao_no_banco(client, db, monkeypatch):
    categorias = garantir_categorias(db)
    lugar = Estabelecimento(
        nome="Cantina",
        endereco="Rua X",
        latitude=Decimal("-21.7946"),
        longitude=Decimal("-48.1756"),
        verificado=True,
        categorias=[categorias["Restaurante"]],
    )
    db.add(lugar)
    db.commit()
    monkeypatch.setattr(
        geocodificacao,
        "geocodificar",
        lambda endereco: geocodificacao.Coordenadas(float(LAT), float(LNG), "Centro"),
    )
    headers = cadastrar_e_logar(client)

    # Tudo o que o app faz com a posição: endereço manual, as três listas, o detalhe,
    # e ainda avaliar e salvar o lugar, que são as ações que gravam algo.
    posicao = {"lat": LAT, "lng": LNG}
    assert client.get(
        "/localizacao/geocodificar", params={"endereco": "Centro"}, headers=headers
    ).is_success
    for eixo in ("comer", "ficar", "fazer"):
        r = client.get("/recomendacoes", params={"eixo": eixo, **posicao}, headers=headers)
        assert r.is_success
    url = f"/estabelecimentos/{lugar.id_estab}"
    assert client.get(url, params=posicao, headers=headers).json()["distancia_km"] is not None
    assert client.put(f"{url}/avaliacao", json={"nota": 5}, headers=headers).is_success
    assert client.put(f"/favoritos/{lugar.id_estab}", headers=headers).is_success

    # Nenhuma linha de nenhuma tabela contém a posição consultada.
    db.expire_all()
    assert db.scalar(select(Estabelecimento.id_estab)) == lugar.id_estab
    for tabela in inspect(db.get_bind()).get_table_names():
        for linha in db.execute(text(f'SELECT * FROM "{tabela}"')):
            conteudo = " ".join(str(valor) for valor in linha)
            assert "793817" not in conteudo and "174123" not in conteudo, tabela
