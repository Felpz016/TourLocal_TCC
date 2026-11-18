"""Envio de e-mail da recuperação de senha.

Nos outros testes não há SMTP configurado, então só o caminho "escreve no log" roda.
Aqui o servidor SMTP é trocado por um falso para conferir o caminho de produção:
a mensagem montada, a conexão protegida (STARTTLS) e o login.
"""

import pytest

from app.core.config import settings
from app.services import email


class SmtpFalso:
    """Imita smtplib.SMTP e guarda o que o código pediu para ele fazer."""

    criados: list["SmtpFalso"] = []

    def __init__(self, host, porta):
        self.host, self.porta = host, porta
        self.chamadas: list[str] = []
        self.login_com = None
        self.enviada = None
        SmtpFalso.criados.append(self)

    def __enter__(self):
        return self

    def __exit__(self, *erro):
        self.chamadas.append("fechou")

    def starttls(self):
        self.chamadas.append("starttls")

    def login(self, usuario, senha):
        self.chamadas.append("login")
        self.login_com = (usuario, senha)

    def send_message(self, mensagem):
        self.chamadas.append("enviou")
        self.enviada = mensagem


@pytest.fixture
def smtp(monkeypatch):
    SmtpFalso.criados = []
    monkeypatch.setattr(email.smtplib, "SMTP", SmtpFalso)
    monkeypatch.setattr(settings, "smtp_host", "smtp.exemplo.com")
    monkeypatch.setattr(settings, "smtp_port", 2525)
    monkeypatch.setattr(settings, "email_remetente", "nao-responda@tourlocal.app")
    return SmtpFalso.criados


def test_monta_a_mensagem_e_protege_a_conexao_antes_do_login(smtp, monkeypatch):
    monkeypatch.setattr(settings, "smtp_usuario", "tourlocal")
    monkeypatch.setattr(settings, "smtp_senha", "segredo")

    email.enviar_email("ana@exemplo.com", "Recuperação de senha", "Seu link: https://x/y")

    [servidor] = smtp
    assert (servidor.host, servidor.porta) == ("smtp.exemplo.com", 2525)
    # A senha só pode ir para o servidor depois do STARTTLS, nunca em texto puro.
    assert servidor.chamadas == ["starttls", "login", "enviou", "fechou"]
    assert servidor.login_com == ("tourlocal", "segredo")

    mensagem = servidor.enviada
    assert mensagem["From"] == "nao-responda@tourlocal.app"
    assert mensagem["To"] == "ana@exemplo.com"
    assert mensagem["Subject"] == "Recuperação de senha"
    assert mensagem.get_content().strip() == "Seu link: https://x/y"


def test_sem_usuario_configurado_envia_sem_login(smtp, monkeypatch):
    # Servidores de rede interna costumam aceitar envio sem autenticação.
    monkeypatch.setattr(settings, "smtp_usuario", "")

    email.enviar_email("ana@exemplo.com", "Assunto", "Corpo")

    [servidor] = smtp
    assert servidor.chamadas == ["starttls", "enviou", "fechou"]
    assert servidor.login_com is None


def test_sem_smtp_so_registra_no_log(monkeypatch, caplog):
    monkeypatch.setattr(settings, "smtp_host", "")
    monkeypatch.setattr(email.smtplib, "SMTP", SmtpFalso)
    SmtpFalso.criados = []

    with caplog.at_level("WARNING"):
        email.enviar_email("ana@exemplo.com", "Assunto", "Corpo do e-mail")

    assert SmtpFalso.criados == []
    assert "ana@exemplo.com" in caplog.text and "Corpo do e-mail" in caplog.text


def test_recuperacao_de_senha_usa_o_smtp_quando_configurado(client, smtp, monkeypatch):
    monkeypatch.setattr(settings, "smtp_usuario", "")
    client.post(
        "/auth/cadastro",
        json={
            "nome": "Ana",
            "email": "ana@exemplo.com",
            "senha": "Senha-forte-1",
            "tipo": "turista",
        },
    )

    resposta = client.post("/auth/recuperar-senha", json={"email": "ana@exemplo.com"})

    assert resposta.status_code == 202, resposta.text
    [servidor] = smtp
    assert servidor.enviada["To"] == "ana@exemplo.com"
    assert "token=" in servidor.enviada.get_content()
