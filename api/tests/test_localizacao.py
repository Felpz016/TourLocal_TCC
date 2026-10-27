import httpx
import pytest

from app.services import geocodificacao
from tests.conftest import cadastrar_e_logar


def test_geocodificar_devolve_coordenadas(client, monkeypatch):
    monkeypatch.setattr(
        geocodificacao,
        "geocodificar",
        lambda endereco: geocodificacao.Coordenadas(-21.79, -48.17, "Centro, Araraquara"),
    )
    headers = cadastrar_e_logar(client)
    resposta = client.get("/localizacao/geocodificar?endereco=Centro Araraquara", headers=headers)
    assert resposta.status_code == 200
    assert resposta.json() == {
        "latitude": -21.79,
        "longitude": -48.17,
        "endereco": "Centro, Araraquara",
    }


def test_endereco_nao_encontrado_retorna_404(client, monkeypatch):
    monkeypatch.setattr(geocodificacao, "geocodificar", lambda endereco: None)
    headers = cadastrar_e_logar(client)
    resposta = client.get("/localizacao/geocodificar?endereco=xyzxyz", headers=headers)
    assert resposta.status_code == 404


def test_geocodificar_exige_login(client):
    assert client.get("/localizacao/geocodificar?endereco=Centro").status_code == 401


def test_servico_le_resposta_do_nominatim():
    def responder(requisicao: httpx.Request) -> httpx.Response:
        assert requisicao.url.params["countrycodes"] == "br"
        assert "TourLocal" in requisicao.headers["User-Agent"]
        return httpx.Response(200, json=[{"lat": "-21.7", "lon": "-48.1", "display_name": "Rua X"}])

    with httpx.Client(transport=httpx.MockTransport(responder)) as http:
        resultado = geocodificacao.geocodificar("Rua X", client=http)
    assert resultado == geocodificacao.Coordenadas(-21.7, -48.1, "Rua X")


def test_servico_fora_do_ar_vira_erro_proprio():
    def falhar(requisicao: httpx.Request) -> httpx.Response:
        return httpx.Response(503)

    with httpx.Client(transport=httpx.MockTransport(falhar)) as http:
        with pytest.raises(geocodificacao.ServicoIndisponivel):
            geocodificacao.geocodificar("Rua X", client=http)
