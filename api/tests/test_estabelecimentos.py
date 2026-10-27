from datetime import time
from decimal import Decimal

import pytest

from app.core.security import criar_token_acesso
from app.models import Avaliacao, Estabelecimento, HorarioFuncionamento, Usuario
from app.models.enums import StatusAvaliacao, TipoUsuario
from app.services.categorias import garantir_categorias
from tests.conftest import cadastrar_e_logar

LAT, LNG = -21.7946, -48.1756


@pytest.fixture
def lugar(db):
    categorias = garantir_categorias(db)
    estab = Estabelecimento(
        nome="Cantina da Praça",
        descricao="Massas caseiras",
        endereco="Rua 1, 100",
        latitude=Decimal(str(round(LAT + 0.009, 6))),
        longitude=Decimal(str(LNG)),
        telefone="+55 16 3333-4444",
        verificado=True,
        categorias=[categorias["Restaurante"]],
        horarios=[
            HorarioFuncionamento(dia_semana=d, hora_abertura=time(11), hora_fechamento=time(15))
            for d in range(7)
        ],
    )
    pendente = Estabelecimento(
        nome="Pendente",
        endereco="Rua 2",
        latitude=Decimal(str(LAT)),
        longitude=Decimal(str(LNG)),
        verificado=False,
    )
    db.add_all([estab, pendente])
    db.commit()
    return estab.id_estab, pendente.id_estab


def test_detalhes_com_distancia_e_contato(client, lugar):
    headers = cadastrar_e_logar(client)
    r = client.get(
        f"/estabelecimentos/{lugar[0]}", params={"lat": LAT, "lng": LNG}, headers=headers
    )
    assert r.status_code == 200
    corpo = r.json()
    assert corpo["nome"] == "Cantina da Praça"
    assert corpo["eixo"] == "comer"
    assert corpo["telefone"] == "+55 16 3333-4444"
    assert len(corpo["horarios"]) == 7
    assert 0.9 < corpo["distancia_km"] < 1.1
    assert corpo["favorito"] is False
    assert corpo["total_avaliacoes"] == 0
    assert corpo["minha_avaliacao"] is None


def test_detalhes_sem_localizacao_nao_tem_distancia(client, lugar):
    headers = cadastrar_e_logar(client)
    r = client.get(f"/estabelecimentos/{lugar[0]}", headers=headers)
    assert r.json()["distancia_km"] is None


def test_nao_verificado_e_inexistente_retornam_404(client, lugar):
    headers = cadastrar_e_logar(client)
    assert client.get(f"/estabelecimentos/{lugar[1]}", headers=headers).status_code == 404
    assert client.get("/estabelecimentos/9999", headers=headers).status_code == 404


def test_administrador_ve_pendente(client, db, lugar):
    # Administradores não se cadastram pela API, então o teste cria um direto no banco.
    adm = Usuario(nome="Adm", email="adm@x.com", senha_hash="x", tipo=TipoUsuario.ADMINISTRADOR)
    db.add(adm)
    db.commit()
    headers = {"Authorization": f"Bearer {criar_token_acesso(adm.id_usuario)}"}
    assert client.get(f"/estabelecimentos/{lugar[1]}", headers=headers).status_code == 200


def test_exige_login(client, lugar):
    assert client.get(f"/estabelecimentos/{lugar[0]}").status_code == 401


def test_avaliar_cria_e_depois_edita(client, lugar):
    headers = cadastrar_e_logar(client)
    url = f"/estabelecimentos/{lugar[0]}/avaliacao"
    r = client.put(url, json={"nota": 3, "comentario": "  Ok  "}, headers=headers)
    assert r.status_code == 200
    assert r.json()["comentario"] == "Ok"
    assert r.json()["minha"] is True

    client.put(url, json={"nota": 5, "comentario": "Ótimo"}, headers=headers)
    detalhe = client.get(f"/estabelecimentos/{lugar[0]}", headers=headers).json()
    assert detalhe["total_avaliacoes"] == 1  # RN04: uma por usuário
    assert detalhe["nota_media"] == 5.0
    assert detalhe["minha_avaliacao"]["nota"] == 5


def test_media_combina_avaliacoes(client, lugar):
    url = f"/estabelecimentos/{lugar[0]}/avaliacao"
    client.put(url, json={"nota": 5}, headers=cadastrar_e_logar(client, email="a@x.com"))
    headers = cadastrar_e_logar(client, email="b@x.com")
    client.put(url, json={"nota": 2}, headers=headers)
    detalhe = client.get(f"/estabelecimentos/{lugar[0]}", headers=headers).json()
    assert detalhe["nota_media"] == 3.5
    assert detalhe["total_avaliacoes"] == 2


@pytest.mark.parametrize("nota", [0, 6])
def test_nota_fora_da_escala(client, lugar, nota):
    headers = cadastrar_e_logar(client)
    r = client.put(f"/estabelecimentos/{lugar[0]}/avaliacao", json={"nota": nota}, headers=headers)
    assert r.status_code == 422


def test_comerciante_nao_avalia_nem_favorita(client, lugar):
    headers = cadastrar_e_logar(client, email="loja@x.com", tipo="comerciante")
    r = client.put(f"/estabelecimentos/{lugar[0]}/avaliacao", json={"nota": 5}, headers=headers)
    assert r.status_code == 403
    assert client.put(f"/favoritos/{lugar[0]}", headers=headers).status_code == 403


def test_nao_avalia_lugar_pendente(client, lugar):
    headers = cadastrar_e_logar(client)
    r = client.put(f"/estabelecimentos/{lugar[1]}/avaliacao", json={"nota": 5}, headers=headers)
    assert r.status_code == 404


def test_excluir_avaliacao(client, lugar):
    headers = cadastrar_e_logar(client)
    url = f"/estabelecimentos/{lugar[0]}/avaliacao"
    client.put(url, json={"nota": 4}, headers=headers)
    assert client.delete(url, headers=headers).status_code == 204
    assert client.delete(url, headers=headers).status_code == 404
    detalhe = client.get(f"/estabelecimentos/{lugar[0]}", headers=headers).json()
    assert detalhe["total_avaliacoes"] == 0


def test_denuncia_oculta_avaliacao(client, lugar):
    url = f"/estabelecimentos/{lugar[0]}/avaliacao"
    autor = cadastrar_e_logar(client, email="autor@x.com")
    id_avaliacao = client.put(url, json={"nota": 1, "comentario": "Ruim"}, headers=autor).json()[
        "id_avaliacao"
    ]
    outro = cadastrar_e_logar(client, email="outro@x.com")
    lista = f"/estabelecimentos/{lugar[0]}/avaliacoes"
    assert len(client.get(lista, headers=outro).json()) == 1

    assert client.post(f"/avaliacoes/{id_avaliacao}/denuncia", headers=outro).status_code == 204
    assert client.get(lista, headers=outro).json() == []
    # A nota denunciada também sai da média (RN06).
    detalhe = client.get(f"/estabelecimentos/{lugar[0]}", headers=outro).json()
    assert detalhe["total_avaliacoes"] == 0


def test_nao_denuncia_a_propria(client, lugar):
    headers = cadastrar_e_logar(client)
    id_avaliacao = client.put(
        f"/estabelecimentos/{lugar[0]}/avaliacao", json={"nota": 4}, headers=headers
    ).json()["id_avaliacao"]
    assert client.post(f"/avaliacoes/{id_avaliacao}/denuncia", headers=headers).status_code == 403


def test_avaliacao_removida_nao_pode_ser_reeditada(client, db, lugar):
    headers = cadastrar_e_logar(client)
    usuario = db.query(Usuario).filter_by(email="ana@exemplo.com").one()
    db.add(
        Avaliacao(
            id_usuario=usuario.id_usuario,
            id_estab=lugar[0],
            nota=1,
            status=StatusAvaliacao.REMOVIDA,
        )
    )
    db.commit()
    r = client.put(f"/estabelecimentos/{lugar[0]}/avaliacao", json={"nota": 5}, headers=headers)
    assert r.status_code == 403


def test_favoritos(client, lugar):
    headers = cadastrar_e_logar(client)
    assert client.get("/favoritos", headers=headers).json() == []

    assert client.put(f"/favoritos/{lugar[0]}", headers=headers).status_code == 204
    # Repetir não duplica.
    assert client.put(f"/favoritos/{lugar[0]}", headers=headers).status_code == 204
    favoritos = client.get("/favoritos", headers=headers).json()
    assert [f["nome"] for f in favoritos] == ["Cantina da Praça"]
    assert client.get(f"/estabelecimentos/{lugar[0]}", headers=headers).json()["favorito"]

    assert client.delete(f"/favoritos/{lugar[0]}", headers=headers).status_code == 204
    assert client.get("/favoritos", headers=headers).json() == []


def test_nao_favorita_pendente(client, lugar):
    headers = cadastrar_e_logar(client)
    assert client.put(f"/favoritos/{lugar[1]}", headers=headers).status_code == 404


def test_favoritos_sao_por_usuario(client, lugar):
    client.put(f"/favoritos/{lugar[0]}", headers=cadastrar_e_logar(client, email="a@x.com"))
    outro = cadastrar_e_logar(client, email="b@x.com")
    assert client.get("/favoritos", headers=outro).json() == []
