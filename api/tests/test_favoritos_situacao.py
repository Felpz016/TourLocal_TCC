"""Salvos mostram se o lugar está aberto agora e quando isso muda (RF14 + RN02).

O turista abre os salvos na rua, muitas vezes à noite, para decidir aonde ir. A lista usa a
mesma regra de horário das recomendações e do detalhe, no fuso da cidade.
"""

from datetime import datetime, time
from decimal import Decimal
from zoneinfo import ZoneInfo

import pytest

from app.models import Estabelecimento, Favorito, HorarioFuncionamento, Usuario
from app.models.enums import TipoUsuario
from app.services import estabelecimento_service as servico
from app.services.categorias import garantir_categorias
from tests.conftest import cadastrar_e_logar

FUSO = ZoneInfo("America/Sao_Paulo")
# 04/11/2026 é uma quarta-feira.
QUARTA_20H = datetime(2026, 11, 4, 20, tzinfo=FUSO)


def _todos_os_dias(abre: time, fecha: time):
    return [
        HorarioFuncionamento(dia_semana=d, hora_abertura=abre, hora_fechamento=fecha)
        for d in range(7)
    ]


@pytest.fixture
def turista(db):
    usuario = Usuario(nome="Ana", email="ana@x.com", senha_hash="x", tipo=TipoUsuario.TURISTA)
    db.add(usuario)
    db.commit()
    return usuario


@pytest.fixture
def salvar(db, turista):
    categorias = garantir_categorias(db)

    def _salvar(nome, horarios, fechado_temporariamente=False):
        estab = Estabelecimento(
            nome=nome,
            endereco="Rua 1",
            latitude=Decimal("-21.79"),
            longitude=Decimal("-48.17"),
            verificado=True,
            fechado_temporariamente=fechado_temporariamente,
            categorias=[categorias["Restaurante"]],
            horarios=horarios,
        )
        db.add(estab)
        db.flush()
        db.add(Favorito(id_usuario=turista.id_usuario, id_estab=estab.id_estab))
        db.commit()

    return _salvar


def _por_nome(db, turista):
    return {f.nome: f for f in servico.listar_favoritos(db, turista, agora=QUARTA_20H)}


def test_salvo_aberto_mostra_quando_fecha(db, turista, salvar):
    salvar("Bar", _todos_os_dias(time(18), time(2)))
    bar = _por_nome(db, turista)["Bar"]
    assert bar.aberto_agora is True
    assert bar.muda_as == "Fecha às 02:00"


def test_salvo_fechado_mostra_quando_abre(db, turista, salvar):
    salvar("Padaria", _todos_os_dias(time(7), time(12)))
    padaria = _por_nome(db, turista)["Padaria"]
    assert padaria.aberto_agora is False
    assert padaria.muda_as == "Abre amanhã às 07:00"


def test_salvo_fechado_temporariamente_nao_promete_reabertura(db, turista, salvar):
    salvar("Museu", _todos_os_dias(time(9), time(22)), fechado_temporariamente=True)
    museu = _por_nome(db, turista)["Museu"]
    assert museu.aberto_agora is False
    assert museu.muda_as is None
    assert museu.fechado_temporariamente is True


def test_salvo_sem_horario_nao_diz_aberto_nem_fechado(db, turista, salvar):
    salvar("Praça", [])
    praca = _por_nome(db, turista)["Praça"]
    assert praca.aberto_agora is None
    assert praca.muda_as is None


def test_rota_de_favoritos_devolve_a_situacao(client, db):
    headers = cadastrar_e_logar(client)
    categorias = garantir_categorias(db)
    estab = Estabelecimento(
        nome="Lanchonete 24h",
        endereco="Rua 2",
        latitude=Decimal("-21.79"),
        longitude=Decimal("-48.17"),
        verificado=True,
        categorias=[categorias["Restaurante"]],
        horarios=_todos_os_dias(time(0), time(0)),
    )
    db.add(estab)
    db.commit()
    assert client.put(f"/favoritos/{estab.id_estab}", headers=headers).status_code == 204
    [salvo] = client.get("/favoritos", headers=headers).json()
    assert salvo["aberto_agora"] is True
    assert salvo["muda_as"] == "Aberto 24 horas"
    assert salvo["fechado_temporariamente"] is False
