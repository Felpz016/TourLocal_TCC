import logging
import re

import pytest

from tests.conftest import cadastrar_e_logar

CADASTRO = {"nome": "Ana", "email": "Ana@Exemplo.com", "senha": "Senha-forte-1", "tipo": "turista"}


def test_cadastro_cria_usuario_sem_expor_a_senha(client):
    resposta = client.post("/auth/cadastro", json=CADASTRO)
    assert resposta.status_code == 201
    corpo = resposta.json()
    assert corpo["email"] == "ana@exemplo.com"
    assert corpo["tipo"] == "turista"
    assert "senha" not in corpo and "senha_hash" not in corpo


def test_cadastro_recusa_email_repetido(client):
    client.post("/auth/cadastro", json=CADASTRO)
    resposta = client.post("/auth/cadastro", json={**CADASTRO, "email": "ana@exemplo.com"})
    assert resposta.status_code == 409


def test_cadastro_nao_permite_criar_administrador(client):
    resposta = client.post("/auth/cadastro", json={**CADASTRO, "tipo": "administrador"})
    assert resposta.status_code == 422


def test_cadastro_exige_senha_com_8_caracteres(client):
    resposta = client.post("/auth/cadastro", json={**CADASTRO, "senha": "Cur-ta"})
    assert resposta.status_code == 422


@pytest.mark.parametrize(
    ("senha", "falta"),
    [
        ("12345678", "maiúscula"),  # só números: o caso que motivou a regra
        ("senha-forte-1", "maiúscula"),
        ("SENHA-FORTE-1", "minúscula"),
        ("SenhaForte1", "caractere especial"),
    ],
)
def test_cadastro_recusa_senha_fraca_e_diz_o_que_falta(client, senha, falta):
    resposta = client.post("/auth/cadastro", json={**CADASTRO, "senha": senha})
    assert resposta.status_code == 422
    assert falta in resposta.json()["detail"][0]["msg"]


def test_redefinir_senha_tambem_exige_senha_forte(client):
    resposta = client.post("/auth/redefinir-senha", json={"token": "x", "nova_senha": "12345678"})
    assert resposta.status_code == 422


def test_login_devolve_token_que_identifica_o_usuario(client):
    headers = cadastrar_e_logar(client)
    resposta = client.get("/auth/me", headers=headers)
    assert resposta.status_code == 200
    assert resposta.json()["email"] == "ana@exemplo.com"


def test_login_com_senha_errada_falha(client):
    client.post("/auth/cadastro", json=CADASTRO)
    resposta = client.post("/auth/login", json={"email": CADASTRO["email"], "senha": "errada123"})
    assert resposta.status_code == 401


def test_rota_protegida_sem_token_retorna_401(client):
    assert client.get("/auth/me").status_code == 401
    assert client.get("/auth/me", headers={"Authorization": "Bearer lixo"}).status_code == 401


def _pedir_link(client, caplog):
    with caplog.at_level(logging.WARNING):
        resposta = client.post("/auth/recuperar-senha", json={"email": CADASTRO["email"]})
    assert resposta.status_code == 202
    return re.search(r"token=(\S+)", caplog.text).group(1)


def test_recuperacao_de_senha_troca_a_senha_e_o_link_vale_uma_vez(client, caplog):
    client.post("/auth/cadastro", json=CADASTRO)
    token = _pedir_link(client, caplog)

    nova = {"token": token, "nova_senha": "Nova-senha-123"}
    assert client.post("/auth/redefinir-senha", json=nova).status_code == 204
    # O mesmo link não serve de novo, porque a senha já mudou.
    assert client.post("/auth/redefinir-senha", json=nova).status_code == 400

    login = {"email": CADASTRO["email"], "senha": "Nova-senha-123"}
    assert client.post("/auth/login", json=login).status_code == 200


def test_recuperacao_nao_revela_se_o_email_existe(client):
    resposta = client.post("/auth/recuperar-senha", json={"email": "ninguem@exemplo.com"})
    assert resposta.status_code == 202


def test_token_de_acesso_nao_serve_para_redefinir_senha(client):
    headers = cadastrar_e_logar(client)
    token_acesso = headers["Authorization"].removeprefix("Bearer ")
    resposta = client.post(
        "/auth/redefinir-senha", json={"token": token_acesso, "nova_senha": "Outra-senha-1"}
    )
    assert resposta.status_code == 400
