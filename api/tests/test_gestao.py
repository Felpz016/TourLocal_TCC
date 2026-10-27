import pytest

from app.core.config import settings
from app.core.security import criar_token_acesso
from app.models import Usuario
from app.models.enums import TipoUsuario
from app.services.categorias import garantir_categorias
from tests.conftest import cadastrar_e_logar

LAT, LNG = -21.7946, -48.1756
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100

DADOS = {
    "nome": "Café do Largo",
    "descricao": "Café coado e pão de queijo",
    "endereco": "Largo 1, Centro",
    "latitude": LAT + 0.002,
    "longitude": LNG,
    "categorias": ["Cafeteria"],
    "faixa_preco": "economico",
    "acessibilidade": True,
    "opcoes_alimentares": ["vegetariano"],
    "telefone": "16 99999-0000",
    "site": "cafedolargo.com.br",
    "horarios": [
        {"dia_semana": d, "hora_abertura": "00:00", "hora_fechamento": "23:59"} for d in range(7)
    ],
}


@pytest.fixture(autouse=True)
def preparar(db, tmp_path, monkeypatch):
    garantir_categorias(db)
    db.commit()
    monkeypatch.setattr(settings, "pasta_uploads", str(tmp_path))


@pytest.fixture
def admin(db):
    adm = Usuario(nome="Adm", email="adm@x.com", senha_hash="x", tipo=TipoUsuario.ADMINISTRADOR)
    db.add(adm)
    db.commit()
    return {"Authorization": f"Bearer {criar_token_acesso(adm.id_usuario)}"}


@pytest.fixture
def comerciante(client):
    return cadastrar_e_logar(client, email="loja@x.com", tipo="comerciante")


def _cadastrar(client, headers, **extra):
    r = client.post("/estabelecimentos", json={**DADOS, **extra}, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()["id_estab"]


def _recomendados(client, headers):
    r = client.get(
        "/recomendacoes", params={"eixo": "comer", "lat": LAT, "lng": LNG}, headers=headers
    )
    return [x["nome"] for x in r.json()["resultados"]]


def test_cadastro_fica_pendente_ate_aprovacao(client, comerciante, admin):
    id_estab = _cadastrar(client, comerciante)
    turista = cadastrar_e_logar(client)
    assert _recomendados(client, turista) == []
    assert client.get(f"/estabelecimentos/{id_estab}", headers=turista).status_code == 404

    meus = client.get("/meus-estabelecimentos", headers=comerciante).json()
    assert [(m["nome"], m["verificado"]) for m in meus] == [("Café do Largo", False)]
    pendentes = client.get("/admin/estabelecimentos/pendentes", headers=admin).json()
    assert pendentes[0]["email_responsavel"] == "loja@x.com"

    r = client.post(f"/admin/estabelecimentos/{id_estab}/aprovar", headers=admin)
    assert r.status_code == 204
    assert _recomendados(client, turista) == ["Café do Largo"]
    detalhe = client.get(f"/estabelecimentos/{id_estab}", headers=turista).json()
    assert detalhe["site"] == "https://cafedolargo.com.br"
    assert detalhe["opcoes_alimentares"] == ["vegetariano"]
    assert detalhe["pode_editar"] is False


def test_turista_nao_cadastra(client):
    turista = cadastrar_e_logar(client)
    assert client.post("/estabelecimentos", json=DADOS, headers=turista).status_code == 403
    assert client.get("/meus-estabelecimentos", headers=turista).status_code == 403


def test_categoria_desconhecida(client, comerciante):
    r = client.post(
        "/estabelecimentos", json={**DADOS, "categorias": ["Nave"]}, headers=comerciante
    )
    assert r.status_code == 422
    assert "Nave" in r.json()["detail"]


def test_so_dono_ou_admin_edita(client, comerciante, admin):
    id_estab = _cadastrar(client, comerciante)
    outro = cadastrar_e_logar(client, email="outra@x.com", tipo="comerciante")
    url = f"/estabelecimentos/{id_estab}"
    assert client.put(url, json=DADOS, headers=outro).status_code == 404
    assert client.put(url, json=DADOS, headers=cadastrar_e_logar(client)).status_code == 404
    assert client.put(url, json={**DADOS, "nome": "Café"}, headers=admin).status_code == 200


def test_mudar_endereco_volta_a_pendente(client, comerciante, admin):
    id_estab = _cadastrar(client, comerciante)
    client.post(f"/admin/estabelecimentos/{id_estab}/aprovar", headers=admin)
    url = f"/estabelecimentos/{id_estab}"

    r = client.put(url, json={**DADOS, "telefone": "16 3000-0000"}, headers=comerciante)
    assert r.json()["verificado"] is True  # contato não exige nova verificação

    r = client.put(url, json={**DADOS, "endereco": "Outra rua, 9"}, headers=comerciante)
    assert r.json()["verificado"] is False


def test_fechamento_temporario_tira_das_recomendacoes(client, comerciante, admin):
    id_estab = _cadastrar(client, comerciante)
    client.post(f"/admin/estabelecimentos/{id_estab}/aprovar", headers=admin)
    turista = cadastrar_e_logar(client)
    assert _recomendados(client, turista) == ["Café do Largo"]

    client.put(
        f"/estabelecimentos/{id_estab}",
        json={**DADOS, "fechado_temporariamente": True},
        headers=comerciante,
    )
    assert _recomendados(client, turista) == []
    detalhe = client.get(f"/estabelecimentos/{id_estab}", headers=turista).json()
    assert detalhe["fechado_temporariamente"] is True
    assert detalhe["aberto_agora"] is False


def test_horarios_sao_substituidos(client, comerciante):
    id_estab = _cadastrar(client, comerciante)
    horarios = [{"dia_semana": 0, "hora_abertura": "08:00", "hora_fechamento": "12:00"}]
    client.put(
        f"/estabelecimentos/{id_estab}", json={**DADOS, "horarios": horarios}, headers=comerciante
    )
    detalhe = client.get(f"/estabelecimentos/{id_estab}", headers=comerciante).json()
    assert detalhe["horarios"] == [
        {"dia_semana": 0, "hora_abertura": "08:00:00", "hora_fechamento": "12:00:00"}
    ]


def test_upload_e_remocao_de_foto(client, comerciante, tmp_path):
    id_estab = _cadastrar(client, comerciante)
    r = client.post(
        f"/estabelecimentos/{id_estab}/fotos",
        files={"arquivo": ("fachada.png", PNG, "image/png")},
        data={"legenda": "Fachada"},
        headers=comerciante,
    )
    assert r.status_code == 201, r.text
    foto = r.json()
    assert foto["url"].startswith("/uploads/") and foto["url"].endswith(".png")
    assert (tmp_path / foto["url"].removeprefix("/uploads/")).read_bytes() == PNG

    assert client.delete(f"/fotos/{foto['id_foto']}", headers=comerciante).status_code == 204
    assert list(tmp_path.iterdir()) == []


def test_foto_com_formato_invalido(client, comerciante):
    id_estab = _cadastrar(client, comerciante)
    r = client.post(
        f"/estabelecimentos/{id_estab}/fotos",
        # Extensão e tipo dizem imagem, mas o conteúdo não é.
        files={"arquivo": ("falsa.jpg", b"<script>alert(1)</script>", "image/jpeg")},
        headers=comerciante,
    )
    assert r.status_code == 422
    assert "JPG, PNG ou WebP" in r.json()["detail"]


def test_foto_grande_demais(client, comerciante, monkeypatch):
    monkeypatch.setattr(settings, "foto_tamanho_maximo_mb", 0)
    id_estab = _cadastrar(client, comerciante)
    r = client.post(
        f"/estabelecimentos/{id_estab}/fotos",
        files={"arquivo": ("f.png", PNG, "image/png")},
        headers=comerciante,
    )
    assert r.status_code == 422
    assert "no máximo" in r.json()["detail"]


def test_limite_de_fotos(client, comerciante, monkeypatch):
    monkeypatch.setattr(settings, "fotos_por_estabelecimento", 1)
    id_estab = _cadastrar(client, comerciante)
    url = f"/estabelecimentos/{id_estab}/fotos"
    arquivo = {"arquivo": ("f.png", PNG, "image/png")}
    assert client.post(url, files=arquivo, headers=comerciante).status_code == 201
    assert client.post(url, files=arquivo, headers=comerciante).status_code == 422


def test_outro_comerciante_nao_envia_foto(client, comerciante):
    id_estab = _cadastrar(client, comerciante)
    outro = cadastrar_e_logar(client, email="outra@x.com", tipo="comerciante")
    r = client.post(
        f"/estabelecimentos/{id_estab}/fotos",
        files={"arquivo": ("f.png", PNG, "image/png")},
        headers=outro,
    )
    assert r.status_code == 404


def test_rejeitar_pendente(client, comerciante, admin):
    id_estab = _cadastrar(client, comerciante)
    assert client.delete(f"/admin/estabelecimentos/{id_estab}", headers=admin).status_code == 204
    assert client.get("/meus-estabelecimentos", headers=comerciante).json() == []


def test_nao_rejeita_verificado(client, comerciante, admin):
    id_estab = _cadastrar(client, comerciante)
    client.post(f"/admin/estabelecimentos/{id_estab}/aprovar", headers=admin)
    assert client.delete(f"/admin/estabelecimentos/{id_estab}", headers=admin).status_code == 409


@pytest.mark.parametrize("manter, total", [(True, 1), (False, 0)])
def test_moderar_denuncia(client, comerciante, admin, manter, total):
    id_estab = _cadastrar(client, comerciante)
    client.post(f"/admin/estabelecimentos/{id_estab}/aprovar", headers=admin)
    autor = cadastrar_e_logar(client, email="autor@x.com")
    id_avaliacao = client.put(
        f"/estabelecimentos/{id_estab}/avaliacao",
        json={"nota": 1, "comentario": "x"},
        headers=autor,
    ).json()["id_avaliacao"]
    client.post(f"/avaliacoes/{id_avaliacao}/denuncia", headers=cadastrar_e_logar(client))

    denunciadas = client.get("/admin/avaliacoes/denunciadas", headers=admin).json()
    assert [d["estabelecimento"] for d in denunciadas] == ["Café do Largo"]

    r = client.post(
        f"/admin/avaliacoes/{id_avaliacao}/decisao", json={"manter": manter}, headers=admin
    )
    assert r.status_code == 204
    assert client.get("/admin/avaliacoes/denunciadas", headers=admin).json() == []
    detalhe = client.get(f"/estabelecimentos/{id_estab}", headers=autor).json()
    assert detalhe["total_avaliacoes"] == total
    # Decidida a denúncia, não há o que decidir de novo.
    r = client.post(
        f"/admin/avaliacoes/{id_avaliacao}/decisao", json={"manter": True}, headers=admin
    )
    assert r.status_code == 404


def test_rotas_de_admin_exigem_admin(client, comerciante):
    for headers in (comerciante, cadastrar_e_logar(client)):
        assert client.get("/admin/estabelecimentos/pendentes", headers=headers).status_code == 403
        assert client.get("/admin/avaliacoes/denunciadas", headers=headers).status_code == 403
