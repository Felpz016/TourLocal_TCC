import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401  (registra todas as tabelas no metadata)
from app.db.base import Base
from app.db.session import get_db
from app.main import app


@pytest.fixture
def sessao_factory():
    # Banco SQLite em memória, recriado a cada teste.
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


@pytest.fixture
def db(sessao_factory):
    """Sessão para os testes prepararem dados direto no banco."""
    with sessao_factory() as sessao:
        yield sessao


@pytest.fixture
def client(sessao_factory):
    def get_test_db():
        sessao = sessao_factory()
        try:
            yield sessao
        finally:
            sessao.close()

    app.dependency_overrides[get_db] = get_test_db
    yield TestClient(app)
    app.dependency_overrides.clear()


def cadastrar_e_logar(client, email="ana@exemplo.com", tipo="turista", senha="Senha-forte-1"):
    client.post(
        "/auth/cadastro", json={"nome": "Ana", "email": email, "senha": senha, "tipo": tipo}
    )
    token = client.post("/auth/login", json={"email": email, "senha": senha}).json()
    return {"Authorization": f"Bearer {token['access_token']}"}
