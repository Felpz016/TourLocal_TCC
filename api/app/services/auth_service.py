"""Regras de cadastro, login e recuperação de senha (UC01: RF01 e RF02)."""

from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.core.limite import Limitador
from app.models import Usuario
from app.repositories import usuario_repository
from app.schemas.usuario import CadastroIn
from app.services.email import enviar_email


class EmailJaCadastrado(Exception):
    pass


class CredenciaisInvalidas(Exception):
    pass


class TokenInvalido(Exception):
    pass


class MuitasTentativas(Exception):
    pass


falhas_de_login = Limitador(settings.login_tentativas_max, settings.login_janela_min * 60)
pedidos_de_recuperacao = Limitador(settings.recuperacao_por_hora, 60 * 60)


def _normalizar_email(email: str) -> str:
    return email.strip().lower()


def cadastrar(db: Session, dados: CadastroIn) -> Usuario:
    email = _normalizar_email(dados.email)
    if usuario_repository.buscar_por_email(db, email):
        raise EmailJaCadastrado()

    usuario = Usuario(
        nome=dados.nome.strip(),
        email=email,
        senha_hash=security.gerar_hash_senha(dados.senha),
        tipo=dados.tipo,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


def autenticar(db: Session, email: str, senha: str, origem: str = "") -> str:
    """Devolve o token de acesso. `origem` é o IP de quem tenta, usado no limite de falhas."""
    email = _normalizar_email(email)
    chave = f"{origem}|{email}"
    if falhas_de_login.excedido(chave):
        raise MuitasTentativas()

    usuario = usuario_repository.buscar_por_email(db, email)
    if usuario is None:
        # Mesmo tempo de resposta de uma senha errada: o tempo não revela quem tem conta.
        security.gastar_tempo_de_verificacao(senha)
    # A mesma mensagem para e-mail inexistente e senha errada evita revelar quem tem conta.
    if not usuario or not security.verificar_senha(senha, usuario.senha_hash):
        falhas_de_login.registrar(chave)
        raise CredenciaisInvalidas()
    falhas_de_login.esquecer(chave)
    return security.criar_token_acesso(usuario.id_usuario, usuario.versao_sessao)


def solicitar_recuperacao(db: Session, email: str) -> None:
    email = _normalizar_email(email)
    # Contado por e-mail, exista a conta ou não, para não revelar quem tem cadastro.
    if pedidos_de_recuperacao.excedido(email):
        raise MuitasTentativas()
    pedidos_de_recuperacao.registrar(email)
    usuario = usuario_repository.buscar_por_email(db, email)
    if not usuario:
        # Não informa se o e-mail existe; a resposta da API é sempre a mesma.
        return

    token = security.criar_token_reset(usuario.id_usuario, usuario.senha_hash)
    link = f"{settings.reset_url}?token={token}"
    enviar_email(
        usuario.email,
        "TourLocal: redefinição de senha",
        f"Olá, {usuario.nome}!\n\n"
        f"Para criar uma nova senha, abra o link abaixo em até "
        f"{settings.reset_token_expira_min} minutos:\n\n{link}\n\n"
        "Se você não pediu a troca, ignore este e-mail.",
    )


def redefinir_senha(db: Session, token: str, nova_senha: str) -> None:
    dados = security.ler_token_reset(token)
    if not dados:
        raise TokenInvalido()

    id_usuario, impressao = dados
    usuario = usuario_repository.buscar_por_id(db, id_usuario)
    if not usuario or not security.token_reset_confere(impressao, usuario.senha_hash):
        raise TokenInvalido()

    usuario.senha_hash = security.gerar_hash_senha(nova_senha)
    # Derruba as sessões abertas: um token roubado deixa de valer depois da troca.
    usuario.versao_sessao = (usuario.versao_sessao or 0) + 1
    db.commit()
