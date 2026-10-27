from datetime import time

from app.importacao.horarios import interpretar


def test_dias_uteis_e_sabado():
    horarios = interpretar("Mo-Fr 08:00-18:00; Sa 08:00-12:00")
    assert (0, time(8), time(18)) in horarios
    assert (4, time(8), time(18)) in horarios
    assert (5, time(8), time(12)) in horarios
    assert all(dia != 6 for dia, _, _ in horarios)


def test_duas_faixas_no_mesmo_dia():
    horarios = interpretar("Mo-Su 11:00-15:00,18:00-23:00")
    assert len(horarios) == 14
    assert (6, time(18), time(23)) in horarios


def test_lista_de_dias_e_intervalo_que_vira_a_semana():
    assert {d for d, _, _ in interpretar("Mo,We 10:00-14:00")} == {0, 2}
    assert {d for d, _, _ in interpretar("Sa-Mo 10:00-14:00")} == {5, 6, 0}


def test_aberto_24_horas_e_meia_noite():
    assert len(interpretar("24/7")) == 7
    assert interpretar("Mo 18:00-24:00") == [(0, time(18), time(23, 59))]


def test_formatos_nao_reconhecidos_sao_ignorados():
    assert interpretar(None) is None
    assert interpretar("Mo-Fr 08:00-18:00; PH off") is None
    assert interpretar("sunrise-sunset") is None
