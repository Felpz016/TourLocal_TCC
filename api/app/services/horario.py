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


def _hora(t) -> str:
    return t.strftime("%H:%M")


def proxima_mudanca(
    horarios: Iterable[HorarioFuncionamento], momento: datetime, aberto: bool | None
) -> str | None:
    """Complemento do "Aberto"/"Fechado", como no Google Maps: quando fecha ou quando abre.

    Ex.: "Fecha às 23:00", "Aberto 24 horas", "Abre às 18:00", "Abre amanhã às 07:00".
    """
    horarios = list(horarios)
    if aberto is None or not horarios:
        return None
    dia, hora = momento.weekday(), momento.time()
    dia_anterior = (momento - timedelta(days=1)).weekday()
    if aberto:
        for h in horarios:
            if h.hora_abertura == h.hora_fechamento and h.dia_semana == dia:
                return "Aberto 24 horas"
            vira_o_dia = h.hora_fechamento <= h.hora_abertura
            de_hoje = h.dia_semana == dia and (
                hora >= h.hora_abertura
                if vira_o_dia
                else h.hora_abertura <= hora < h.hora_fechamento
            )
            de_ontem = vira_o_dia and h.dia_semana == dia_anterior and hora < h.hora_fechamento
            if de_hoje or de_ontem:
                return f"Fecha às {_hora(h.hora_fechamento)}"
        return None
    ainda_hoje = sorted(
        h.hora_abertura for h in horarios if h.dia_semana == dia and h.hora_abertura > hora
    )
    if ainda_hoje:
        return f"Abre às {_hora(ainda_hoje[0])}"
    amanha = sorted(
        h.hora_abertura for h in horarios if h.dia_semana == (momento + timedelta(days=1)).weekday()
    )
    return f"Abre amanhã às {_hora(amanha[0])}" if amanha else None
