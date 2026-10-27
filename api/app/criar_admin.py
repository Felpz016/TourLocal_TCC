"""Cria (ou promove) uma conta de administrador.

Administradores não se cadastram pelo app. Uso:

    python -m app.criar_admin --nome "Felipe" --email admin@tourlocal.app

A senha é pedida no terminal, sem aparecer na tela.
"""

import argparse
import getpass

from app.core.security import gerar_hash_senha
from app.db.session import SessionLocal
from app.models import Usuario
from app.models.enums import TipoUsuario
from app.repositories import usuario_repository


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--nome", required=True)
    parser.add_argument("--email", required=True)
    args = parser.parse_args()

    with SessionLocal() as db:
        usuario = usuario_repository.buscar_por_email(db, args.email.lower())
        if usuario:
            usuario.tipo = TipoUsuario.ADMINISTRADOR
            print(f"{usuario.email} agora é administrador.")
        else:
            senha = getpass.getpass("Senha (mínimo 8 caracteres): ")
            if len(senha) < 8:
                raise SystemExit("Senha curta demais.")
            db.add(
                Usuario(
                    nome=args.nome,
                    email=args.email.lower(),
                    senha_hash=gerar_hash_senha(senha),
                    tipo=TipoUsuario.ADMINISTRADOR,
                )
            )
            print(f"Administrador {args.email} criado.")
        db.commit()


if __name__ == "__main__":
    main()
