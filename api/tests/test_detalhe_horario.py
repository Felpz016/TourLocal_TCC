"""Linha de horário da tela de detalhes ("Aberto · Fecha às 02:00"), calculada pela API.

Antes o app fazia esse cálculo sozinho, com o relógio do celular e sem tratar faixas que
passam da meia-noite. Agora o detalhe usa a mesma regra da lista de recomendações.
"""

from datetime import datetime, time
from decimal import Decimal
from zoneinfo import ZoneInfo

import pytest

from app.models import Estabelecimento, HorarioFuncionamento, Usuario
from app.models.enums import TipoUsuario
from app.services import estabelecimento_service as servico
from app.services.categorias import garantir_categorias
from tests.conftest import cadastrar_e_logar

FUSO = ZoneInfo("America/Sao_Paulo")
# 04/11/2026 é uma quarta-feira (dia_semana 2; a API conta 0 = segunda).
QUARTA = datetime(2026, 11, 4, tzinfo=FUSO)


def _em(hora: int, minuto: int = 0) -> datetime:
    return QUARTA.replace(hour=hora, minute=minuto)


def _faixas(abre: time, fecha: time):
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
def criar(db):
    categorias = garantir_categorias(db)

    def _criar(horarios, fechado_temporariamente=False):
        estab = Estabelecimento(
            nome="Lugar",
            endereco="Rua 1",
            latitude=Decimal("-21.79"),
            longitude=Decimal("-48.17"),
            verificado=True,
            fechado_temporariamente=fechado_temporariamente,
            categorias=[categorias["Restaurante"]],
            horarios=horarios,
        )
        db.add(estab)
        db.commit()
        return estab.id_estab

    return _criar


def _detalhe(db, id_estab, usuario, momento):
    return servico.detalhar(db, id_estab, usuario, None, None, agora=momento)


def test_aberto_mostra_quando_fecha(db, turista, criar):
    id_estab = criar(_faixas(time(11), time(15)))
    d = _detalhe(db, id_estab, turista, _em(12))
    assert d.aberto_agora is True
    assert d.muda_as == "Fecha às 15:00"


def test_fechado_mostra_quando_abre_hoje_ou_amanha(db, turista, criar):
    id_estab = criar(_faixas(time(11), time(15)))
    assert _detalhe(db, id_estab, turista, _em(9)).muda_as == "Abre às 11:00"
    assert _detalhe(db, id_estab, turista, _em(16)).muda_as == "Abre amanhã às 11:00"


def test_faixa_que_passa_da_meia_noite(db, turista, criar):
    # Bar das 18:00 às 02:00: à 01:00 ainda está aberto pela faixa de terça.
    id_estab = criar(_faixas(time(18), time(2)))
    madrugada = _detalhe(db, id_estab, turista, _em(1))
    assert madrugada.aberto_agora is True
    assert madrugada.muda_as == "Fecha às 02:00"
    assert _detalhe(db, id_estab, turista, _em(23)).muda_as == "Fecha às 02:00"


def test_aberto_24_horas(db, turista, criar):
    id_estab = criar(_faixas(time(0), time(0)))
    assert _detalhe(db, id_estab, turista, _em(3)).muda_as == "Aberto 24 horas"


def test_sem_horario_ou_fechado_temporariamente_nao_tem_linha(db, turista, criar):
    sem_horario = criar([])
    assert _detalhe(db, sem_horario, turista, _em(12)).muda_as is None

    fechado = criar(_faixas(time(11), time(15)), fechado_temporariamente=True)
    d = _detalhe(db, fechado, turista, _em(12))
    assert d.aberto_agora is False
    assert d.muda_as is None


def test_campo_chega_na_resposta_da_api(client, criar):
    id_estab = criar(_faixas(time(0), time(0)))
    headers = cadastrar_e_logar(client)
    corpo = client.get(f"/estabelecimentos/{id_estab}", headers=headers).json()
    assert corpo["muda_as"] == "Aberto 24 horas"
