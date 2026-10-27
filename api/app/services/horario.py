"""Regras de funcionamento (RN02)."""

from collections.abc import Iterable
from datetime import datetime, timedelta

from app.models import HorarioFuncionamento


def esta_aberto(horarios: Iterable[HorarioFuncionamento], momento: datetime) -> bool | None:
    """True/False conforme os horários cadastrados, ou None se não houver horário.

    Faixas que passam da meia-noite (ex.: 18:00 às 02:00) contam também na madrugada
    do dia seguinte.
    """
    horarios = list(horarios)
    if not horarios:
        return None

    dia, hora = momento.weekday(), momento.time()
    dia_anterior = (momento - timedelta(days=1)).weekday()
    for h in horarios:
        vira_o_dia = h.hora_fechamento <= h.hora_abertura
        if h.dia_semana == dia:
            if vira_o_dia and hora >= h.hora_abertura:
                return True
            if not vira_o_dia and h.hora_abertura <= hora < h.hora_fechamento:
                return True
        if vira_o_dia and h.dia_semana == dia_anterior and hora < h.hora_fechamento:
            return True
    return False
