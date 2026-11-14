import pytest
from sqlalchemy import func, select

from app import demo
from app.models import Avaliacao, Denuncia, Estabelecimento, Usuario


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


def _entrar(client, conta):
    r = client.post(
        "/auth/login", json={"email": f"{conta}@demo.tourlocal.app", "senha": demo.SENHA}
    )
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.mark.parametrize("manter, total, media", [(True, 4, 3.8), (False, 3, 4.7)])
def test_demonstracao_tem_uma_avaliacao_denunciada_para_moderar(client, db, manter, total, media):
    """O roteiro da banca mostra a moderação de avaliações (RF18, RN06, RN05)."""
    demo.criar(db)
    demo.criar(db)  # rodar de novo não duplica a avaliação nem a denúncia
    assert db.scalar(select(func.count()).select_from(Denuncia)) == 1
    cantina = db.scalar(
        select(Estabelecimento).where(Estabelecimento.origem_externa == "demo:cantina")
    )
    turista, admin = _entrar(client, "turista"), _entrar(client, "admin")

    # RN06: enquanto a moderação não decide, a turista não vê a avaliação nem ela conta na média.
    detalhe = client.get(f"/estabelecimentos/{cantina.id_estab}", headers=turista).json()
    assert detalhe["total_avaliacoes"] == 3
    assert detalhe["nota_media"] == 4.7
    comentarios = [
        a["comentario"]
        for a in client.get(
            f"/estabelecimentos/{cantina.id_estab}/avaliacoes", headers=turista
        ).json()
    ]
    assert demo.DENUNCIADA["comentario"] not in comentarios

    # RF18: o administrador encontra a avaliação na Moderação e decide.
    [denunciada] = client.get("/admin/avaliacoes/denunciadas", headers=admin).json()
    assert denunciada["estabelecimento"] == "Cantina Nonna Lúcia"
    r = client.post(
        f"/admin/avaliacoes/{denunciada['id_avaliacao']}/decisao",
        json={"manter": manter},
        headers=admin,
    )
    assert r.status_code == 204

    # RN05: a média passa a refletir a decisão da moderação.
    detalhe = client.get(f"/estabelecimentos/{cantina.id_estab}", headers=turista).json()
    assert detalhe["total_avaliacoes"] == total
    assert detalhe["nota_media"] == media

    demo.limpar(db)
    assert db.scalar(select(func.count()).select_from(Denuncia)) == 0
    assert db.scalar(select(func.count()).select_from(Usuario)) == 0
