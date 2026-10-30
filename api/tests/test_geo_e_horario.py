from datetime import datetime, time

import pytest

from app.models import HorarioFuncionamento
from app.services.geo import caixa_delimitadora, haversine_km
from app.services.horario import esta_aberto, proxima_mudanca


def test_haversine_entre_araraquara_e_sao_carlos():
    # Pontos centrais das duas cidades, a cerca de 38 km em linha reta.
    assert haversine_km(-21.7946, -48.1756, -22.0175, -47.8908) == pytest.approx(38.4, abs=0.1)


def test_haversine_mesmo_ponto_e_zero():
    assert haversine_km(-21.79, -48.17, -21.79, -48.17) == 0


def test_caixa_contem_o_circulo():
    lat_min, lat_max, lon_min, lon_max = caixa_delimitadora(-21.79, -48.17, 5)
    assert haversine_km(-21.79, -48.17, lat_max, -48.17) == pytest.approx(5, rel=0.01)
    assert haversine_km(-21.79, -48.17, -21.79, lon_max) == pytest.approx(5, rel=0.01)
    assert lat_min < -21.79 < lat_max and lon_min < -48.17 < lon_max


def _h(dia, abre, fecha):
    return HorarioFuncionamento(dia_semana=dia, hora_abertura=abre, hora_fechamento=fecha)


# 2026-10-27 é uma terça-feira (dia 1).
TERCA_12H = datetime(2026, 10, 27, 12, 0)


def test_aberto_dentro_da_faixa_e_fechado_fora():
    horarios = [_h(1, time(11), time(15))]
    assert esta_aberto(horarios, TERCA_12H) is True
    assert esta_aberto(horarios, datetime(2026, 10, 27, 15, 0)) is False
    assert esta_aberto(horarios, datetime(2026, 10, 28, 12, 0)) is False


def test_faixa_que_passa_da_meia_noite():
    horarios = [_h(1, time(18), time(2))]
    assert esta_aberto(horarios, datetime(2026, 10, 27, 23, 0)) is True
    assert esta_aberto(horarios, datetime(2026, 10, 28, 1, 30)) is True
    assert esta_aberto(horarios, datetime(2026, 10, 28, 3, 0)) is False


def test_sem_horario_cadastrado_e_desconhecido():
    assert esta_aberto([], TERCA_12H) is None


@pytest.mark.parametrize(
    ("horarios", "momento", "esperado"),
    [
        # Terça, 12h, aberto das 11h às 15h.
        ([_h(1, time(11), time(15))], datetime(2026, 10, 27, 12), "Fecha às 15:00"),
        # Terça, 9h: ainda vai abrir hoje.
        ([_h(1, time(11), time(15))], datetime(2026, 10, 27, 9), "Abre às 11:00"),
        # Terça, 16h: só abre na quarta.
        (
            [_h(1, time(11), time(15)), _h(2, time(10), time(15))],
            datetime(2026, 10, 27, 16),
            "Abre amanhã às 10:00",
        ),
        # Quarta, 1h: ainda é o turno de terça, das 18h às 2h.
        ([_h(1, time(18), time(2))], datetime(2026, 10, 28, 1), "Fecha às 02:00"),
        # Hotel: abertura igual ao fechamento.
        ([_h(1, time(0), time(0))], datetime(2026, 10, 27, 3), "Aberto 24 horas"),
        # Sem horários informados.
        ([], datetime(2026, 10, 27, 12), None),
    ],
)
def test_proxima_mudanca(horarios, momento, esperado):
    assert proxima_mudanca(horarios, momento, esta_aberto(horarios, momento)) == esperado
