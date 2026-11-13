"""Respostas grandes vão comprimidas com gzip quando o aparelho aceita (RNF01)."""

from decimal import Decimal

from app.models import Estabelecimento
from app.services.categorias import garantir_categorias
from tests.conftest import cadastrar_e_logar
from tests.test_recomendacoes import LAT, LNG


def _muitos_lugares(db, quantidade=20):
    restaurante = garantir_categorias(db)["Restaurante"]
    for i in range(quantidade):
        db.add(
            Estabelecimento(
                nome=f"Restaurante {i}",
                endereco=f"Rua das Flores, {i}",
                latitude=Decimal(str(round(LAT + i * 0.0005, 6))),
                longitude=Decimal(str(LNG)),
                verificado=True,
                categorias=[restaurante],
            )
        )
    db.commit()


def _lista(client, headers):
    return client.get(
        "/recomendacoes",
        params={"eixo": "comer", "lat": LAT, "lng": LNG, "incluir_fechados": True},
        headers=headers,
    )


def test_lista_de_recomendacoes_vai_comprimida(client, db):
    _muitos_lugares(db)
    headers = {**cadastrar_e_logar(client), "Accept-Encoding": "gzip"}

    r = _lista(client, headers)

    assert r.status_code == 200
    assert r.headers["content-encoding"] == "gzip"
    # Caches e proxies precisam saber que a resposta muda conforme o Accept-Encoding.
    assert "accept-encoding" in r.headers["vary"].lower()
    # O cliente HTTP descompacta sozinho: o app recebe o mesmo JSON de antes.
    assert len(r.json()["resultados"]) == 20
    assert int(r.headers["content-length"]) < len(r.content) / 3


def test_sem_accept_encoding_a_resposta_vai_como_antes(client, db):
    _muitos_lugares(db)
    headers = {**cadastrar_e_logar(client), "Accept-Encoding": "identity"}

    r = _lista(client, headers)

    assert r.status_code == 200
    assert "content-encoding" not in r.headers
    assert len(r.json()["resultados"]) == 20


def test_resposta_pequena_nao_e_comprimida(client):
    r = client.get("/health", headers={"Accept-Encoding": "gzip"})
    assert r.status_code == 200
    assert "content-encoding" not in r.headers


def test_resposta_comprimida_mantem_cabecalhos_de_seguranca(client, db):
    _muitos_lugares(db)
    headers = {**cadastrar_e_logar(client), "Accept-Encoding": "gzip"}

    r = _lista(client, headers)

    assert r.headers["content-encoding"] == "gzip"
    assert r.headers["X-Content-Type-Options"] == "nosniff"
