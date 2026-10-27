"""Interpreta o campo opening_hours do OpenStreetMap nos casos mais comuns.

Exemplos aceitos: "Mo-Fr 08:00-18:00; Sa 08:00-12:00", "Mo,We 10:00-14:00",
"Mo-Su 11:00-15:00,18:00-23:00" e "24/7". Regras mais complexas (feriados, meses,
"off") são ignoradas: nesses casos o estabelecimento fica sem horário e o comerciante
pode completar depois (RF16).
"""

import re
from datetime import time

DIAS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
_FAIXA_HORA = re.compile(r"^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$")

# (dia_semana, abertura, fechamento), com 0 = segunda-feira.
Horario = tuple[int, time, time]


def _hora(h: str, m: str) -> time:
    hora = int(h)
    # "24:00" é usado no OSM para meia-noite no fim do dia.
    return time(23, 59) if hora == 24 else time(hora, int(m))


def _dias(trecho: str) -> list[int] | None:
    dias: list[int] = []
    for parte in trecho.split(","):
        if "-" in parte:
            inicio, fim = parte.split("-", 1)
            if inicio not in DIAS or fim not in DIAS:
                return None
            i, f = DIAS.index(inicio), DIAS.index(fim)
            dias.extend(range(i, f + 1) if i <= f else [*range(i, 7), *range(0, f + 1)])
        elif parte in DIAS:
            dias.append(DIAS.index(parte))
        else:
            return None
    return dias


def interpretar(opening_hours: str | None) -> list[Horario] | None:
    """Devolve a lista de horários ou None se o formato não for reconhecido."""
    if not opening_hours:
        return None
    texto = opening_hours.strip()
    if texto == "24/7":
        return [(dia, time(0, 0), time(23, 59)) for dia in range(7)]

    horarios: list[Horario] = []
    for regra in texto.split(";"):
        partes = regra.strip().split()
        if len(partes) == 1:
            # Só o horário, sem dias, vale para a semana toda.
            dias, faixas = list(range(7)), partes[0]
        elif len(partes) == 2:
            dias, faixas = _dias(partes[0]), partes[1]
        else:
            return None
        if dias is None:
            return None
        for faixa in faixas.split(","):
            casamento = _FAIXA_HORA.match(faixa)
            if not casamento:
                return None
            h1, m1, h2, m2 = casamento.groups()
            for dia in dias:
                horarios.append((dia, _hora(h1, m1), _hora(h2, m2)))
    return horarios or None
