"""Limite de cadastros pendentes por comerciante (RF15, RN01; OWASP API4)."""

from app.core.config import settings
from tests.conftest import cadastrar_e_logar
from tests.test_gestao import DADOS, admin, comerciante, preparar  # noqa: F401


def _novo(client, headers, nome):
    return client.post("/estabelecimentos", json={**DADOS, "nome": nome}, headers=headers)


def test_quarto_cadastro_pendente_e_recusado(client, comerciante):  # noqa: F811
    for i in range(settings.cadastros_pendentes_max):
        assert _novo(client, comerciante, f"Local {i}").status_code == 201

    r = _novo(client, comerciante, "Local a mais")
    assert r.status_code == 429
    assert "aguardando a verificação" in r.json()["detail"]
    meus = client.get("/meus-estabelecimentos", headers=comerciante).json()
    assert len(meus) == settings.cadastros_pendentes_max


def test_aprovar_ou_rejeitar_libera_a_vaga(client, comerciante, admin):  # noqa: F811
    ids = [
        _novo(client, comerciante, f"Local {i}").json()["id_estab"]
        for i in range(settings.cadastros_pendentes_max)
    ]
    assert _novo(client, comerciante, "Extra").status_code == 429

    client.post(f"/admin/estabelecimentos/{ids[0]}/aprovar", headers=admin)
    assert _novo(client, comerciante, "Depois da aprovação").status_code == 201
    assert _novo(client, comerciante, "Extra").status_code == 429

    client.delete(f"/admin/estabelecimentos/{ids[1]}", headers=admin)
    assert _novo(client, comerciante, "Depois da rejeição").status_code == 201


def test_limite_e_por_comerciante(client, comerciante):  # noqa: F811
    for i in range(settings.cadastros_pendentes_max):
        _novo(client, comerciante, f"Local {i}")
    outro = cadastrar_e_logar(client, email="outra-loja@x.com", tipo="comerciante")
    assert _novo(client, outro, "Loja de outra pessoa").status_code == 201


def test_editar_local_pendente_continua_permitido(client, comerciante):  # noqa: F811
    ids = [
        _novo(client, comerciante, f"Local {i}").json()["id_estab"]
        for i in range(settings.cadastros_pendentes_max)
    ]
    r = client.put(
        f"/estabelecimentos/{ids[0]}", json={**DADOS, "nome": "Novo nome"}, headers=comerciante
    )
    assert r.status_code == 200
