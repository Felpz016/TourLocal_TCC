"""Pedidos grandes demais são recusados antes de a API ler o corpo (OWASP API4)."""

import starlette.formparsers

from app.core.config import settings
from tests.conftest import cadastrar_e_logar

# `preparar` (autouse) cria as categorias e usa uma pasta temporária para as fotos.
from tests.test_gestao import PNG, _cadastrar, preparar  # noqa: F401

JPEG_GRANDE = b"\xff\xd8\xff" + b"0" * (8 * 1024 * 1024)  # 8 MB, acima das fotos de 5 MB


def _contar_bytes_lidos_do_formulario(monkeypatch) -> dict:
    lidos = {"bytes": 0}
    original = starlette.formparsers.MultiPartParser.on_part_data

    def contar(self, data, start, end):
        lidos["bytes"] += end - start
        return original(self, data, start, end)

    monkeypatch.setattr(starlette.formparsers.MultiPartParser, "on_part_data", contar)
    return lidos


def test_foto_enorme_sem_login_e_recusada_sem_ser_lida(client, monkeypatch):
    lidos = _contar_bytes_lidos_do_formulario(monkeypatch)
    r = client.post("/estabelecimentos/1/fotos", files={"arquivo": ("a.jpg", JPEG_GRANDE)})
    assert r.status_code == 413
    # Antes, os 8 MB eram lidos e gravados em arquivo temporário só para responder 401.
    assert lidos["bytes"] == 0


def test_json_enorme_no_login_e_recusado(client):
    corpo = b'{"email": "a@x.com", "senha": "' + b"a" * (1024 * 1024) + b'"}'
    r = client.post("/auth/login", content=corpo, headers={"content-type": "application/json"})
    assert r.status_code == 413
    assert r.json() == {"detail": "Requisição grande demais"}


def test_corpo_enviado_em_partes_tambem_tem_limite(client):
    # Sem Content-Length (Transfer-Encoding: chunked), o limite vale pelo que chega.
    def partes():
        for _ in range(512):
            yield b"a" * 1024

    r = client.post(
        "/auth/recuperar-senha", content=partes(), headers={"content-type": "application/json"}
    )
    assert r.status_code == 413


def test_resposta_413_leva_cabecalhos_de_seguranca(client):
    r = client.post("/auth/login", content=b"a" * (300 * 1024))
    assert r.status_code == 413
    assert r.headers["X-Content-Type-Options"] == "nosniff"


def test_foto_dentro_do_limite_continua_funcionando(client):
    comerciante = cadastrar_e_logar(client, email="loja@x.com", tipo="comerciante")
    id_estab = _cadastrar(client, comerciante)
    r = client.post(
        f"/estabelecimentos/{id_estab}/fotos",
        files={"arquivo": ("f.png", PNG, "image/png")},
        data={"legenda": "Fachada"},
        headers=comerciante,
    )
    assert r.status_code == 201


def test_foto_pouco_acima_do_limite_mantem_a_mensagem_amigavel(client):
    # Até a folga do formulário, quem explica o problema é a própria rota (422).
    comerciante = cadastrar_e_logar(client, email="loja@x.com", tipo="comerciante")
    id_estab = _cadastrar(client, comerciante)
    foto = b"\xff\xd8\xff" + b"0" * (settings.foto_tamanho_maximo_mb * 1024 * 1024)
    r = client.post(
        f"/estabelecimentos/{id_estab}/fotos",
        files={"arquivo": ("f.jpg", foto, "image/jpeg")},
        headers=comerciante,
    )
    assert r.status_code == 422
    assert "no máximo" in r.json()["detail"]


def test_json_normal_continua_funcionando(client):
    comerciante = cadastrar_e_logar(client, email="loja@x.com", tipo="comerciante")
    assert _cadastrar(client, comerciante)
