import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.config import CHAVE_DE_DESENVOLVIMENTO, Settings
from app.main import app


def test_desenvolvimento_aceita_a_chave_padrao():
    assert Settings(ambiente="desenvolvimento").secret_key == CHAVE_DE_DESENVOLVIMENTO


@pytest.mark.parametrize("chave", [CHAVE_DE_DESENVOLVIMENTO, "curta-demais"])
def test_producao_recusa_chave_padrao_ou_curta(chave):
    with pytest.raises(ValidationError, match="SECRET_KEY"):
        Settings(ambiente="producao", secret_key=chave)


def test_producao_aceita_chave_longa():
    Settings(ambiente="producao", secret_key="x" * 48)


def test_respostas_levam_cabecalhos_de_seguranca():
    resposta = TestClient(app).get("/health")
    assert resposta.headers["X-Content-Type-Options"] == "nosniff"
    assert resposta.headers["X-Frame-Options"] == "DENY"
    assert resposta.headers["Referrer-Policy"] == "no-referrer"
