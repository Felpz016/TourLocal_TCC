"""Hash de senhas (RNF06) e tokens JWT de acesso e de recuperação de senha (RF02)."""

from datetime import UTC, datetime, timedelta

import jwt
from pwdlib import PasswordHash

from app.core.config import settings

ALGORITMO = "HS256"

# Argon2 com sal aleatório por senha, como pede o RNF06.
_hasher = PasswordHash.recommended()


def gerar_hash_senha(senha: str) -> str:
    return _hasher.hash(senha)


def verificar_senha(senha: str, senha_hash: str) -> bool:
    return _hasher.verify(senha, senha_hash)


def _gerar_token(dados: dict, expira_em_min: int) -> str:
    agora = datetime.now(UTC)
    payload = {**dados, "iat": agora, "exp": agora + timedelta(minutes=expira_em_min)}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITMO)


def _ler_token(token: str, finalidade: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITMO])
    except jwt.PyJWTError:
        return None
    if payload.get("fin") != finalidade:
        return None
    return payload


def criar_token_acesso(id_usuario: int) -> str:
    return _gerar_token({"sub": str(id_usuario), "fin": "acesso"}, settings.access_token_expira_min)


def ler_token_acesso(token: str) -> int | None:
    payload = _ler_token(token, "acesso")
    return int(payload["sub"]) if payload else None


def _impressao_senha(senha_hash: str) -> str:
    # Trecho final do hash atual. Quando a senha muda, o hash muda e o token antigo deixa de valer,
    # o que torna o link de recuperação de uso único sem precisar de tabela extra.
    return senha_hash[-16:]


def criar_token_reset(id_usuario: int, senha_hash: str) -> str:
    dados = {"sub": str(id_usuario), "fin": "reset", "sh": _impressao_senha(senha_hash)}
    return _gerar_token(dados, settings.reset_token_expira_min)


def ler_token_reset(token: str) -> tuple[int, str] | None:
    """Devolve (id_usuario, impressão da senha) ou None se o token for inválido ou expirado."""
    payload = _ler_token(token, "reset")
    if not payload:
        return None
    return int(payload["sub"]), payload["sh"]


def token_reset_confere(impressao: str, senha_hash_atual: str) -> bool:
    return impressao == _impressao_senha(senha_hash_atual)
