from sqlalchemy import func, select

from app import demo
from app.models import Avaliacao, Estabelecimento, Usuario


def test_dados_de_demonstracao_podem_rodar_de_novo_e_ser_apagados(client, db):
    demo.criar(db)
    demo.criar(db)  # rodar de novo atualiza em vez de duplicar
    assert db.scalar(select(func.count()).select_from(Estabelecimento)) == len(demo.LUGARES)
    pendentes = db.scalars(select(Estabelecimento).where(Estabelecimento.verificado.is_(False)))
    assert [e.nome for e in pendentes] == ["Hotel Boulevard Novo"]

    # A conta de demonstração entra pelo app com a senha documentada.
    r = client.post(
        "/auth/login",
        json={"email": "turista@demo.tourlocal.app", "senha": demo.SENHA},
    )
    assert r.status_code == 200

    demo.limpar(db)
    assert db.scalar(select(func.count()).select_from(Estabelecimento)) == 0
    assert db.scalar(select(func.count()).select_from(Avaliacao)) == 0
    assert db.scalar(select(func.count()).select_from(Usuario)) == 0
