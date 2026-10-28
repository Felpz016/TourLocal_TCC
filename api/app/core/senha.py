"""Regra de senha forte, usada no cadastro, na troca de senha e no criar_admin.

Além do mínimo de 8 caracteres, a senha precisa misturar letra maiúscula, letra minúscula e
um caractere especial (qualquer coisa que não seja letra, número ou espaço, como ! @ # -).
Assim, senhas só de números ("12345678") ou só de letras deixam de ser aceitas.
"""

TAMANHO_MINIMO = 8


def problemas_da_senha(senha: str) -> list[str]:
    """Lista o que falta na senha; lista vazia quer dizer senha aceita."""
    problemas = []
    if len(senha) < TAMANHO_MINIMO:
        problemas.append(f"ter pelo menos {TAMANHO_MINIMO} caracteres")
    if not any(c.isupper() for c in senha):
        problemas.append("ter uma letra maiúscula")
    if not any(c.islower() for c in senha):
        problemas.append("ter uma letra minúscula")
    if not any(not c.isalnum() and not c.isspace() for c in senha):
        problemas.append("ter um caractere especial (como ! @ # -)")
    return problemas


def validar_senha(senha: str) -> str:
    """Validador do Pydantic: devolve a senha ou explica o que falta nela."""
    problemas = problemas_da_senha(senha)
    if problemas:
        raise ValueError("A senha precisa " + ", ".join(problemas) + ".")
    return senha
