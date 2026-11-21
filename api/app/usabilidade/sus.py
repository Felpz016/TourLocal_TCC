"""Calcula a pontuação SUS e as métricas das tarefas do teste de usabilidade (RNF03).

Lê as planilhas preenchidas durante o teste (exportadas em CSV) e imprime tabelas em
Markdown, prontas para o relatório de testes. Uso, a partir da pasta api/:

    python -m app.usabilidade.sus ../docs/usabilidade/exemplo-ficticio-sus.csv
    python -m app.usabilidade.sus ../docs/usabilidade/exemplo-ficticio-sus.csv \\
        --tarefas ../docs/usabilidade/exemplo-ficticio-tarefas.csv

Formato das planilhas em docs/teste-usabilidade.md. Usa só a biblioteca padrão.
"""

import argparse
import csv
import statistics
import sys
from dataclasses import dataclass
from pathlib import Path

# Pontuação mínima exigida pelo RNF03 (média de referência da escala SUS).
META_SUS = 68.0
# RNF03: a rota de um local recomendado em, no máximo, três toques a partir da tela inicial.
META_TOQUES = 3

ITENS = [f"q{i}" for i in range(1, 11)]
SITUACOES = {"sim", "ajuda", "nao"}


class PlanilhaInvalida(ValueError):
    """Erro de preenchimento, com a linha da planilha para facilitar a correção."""


def pontuacao_sus(respostas: list[int]) -> float:
    """Pontuação SUS (0 a 100) de um participante, segundo Brooke (1996).

    Itens ímpares (afirmações positivas) valem resposta − 1; itens pares (negativas)
    valem 5 − resposta. A soma (0 a 40) é multiplicada por 2,5.
    """
    if len(respostas) != 10:
        raise ValueError(f"O SUS tem 10 itens; vieram {len(respostas)}.")
    for valor in respostas:
        if valor not in (1, 2, 3, 4, 5):
            raise ValueError(f"Respostas vão de 1 a 5; veio {valor}.")
    soma = sum(
        (valor - 1) if numero % 2 == 1 else (5 - valor)
        for numero, valor in enumerate(respostas, start=1)
    )
    return soma * 2.5


def _ler_csv(caminho: Path, colunas: list[str]) -> list[tuple[int, dict[str, str]]]:
    with caminho.open(encoding="utf-8-sig", newline="") as arquivo:
        leitor = csv.DictReader(arquivo)
        faltando = [c for c in colunas if c not in (leitor.fieldnames or [])]
        if faltando:
            raise PlanilhaInvalida(f"{caminho.name}: faltam as colunas {', '.join(faltando)}.")
        # A linha 1 é o cabeçalho, então os dados começam na linha 2.
        return [
            (numero, {k: (v or "").strip() for k, v in linha.items() if k})
            for numero, linha in enumerate(leitor, start=2)
            if any((v or "").strip() for v in linha.values())
        ]


def ler_sus(caminho: Path) -> dict[str, float]:
    """Pontuação SUS de cada participante, na ordem da planilha."""
    pontuacoes: dict[str, float] = {}
    for numero, linha in _ler_csv(caminho, ["participante", *ITENS]):
        participante = linha["participante"]
        if not participante:
            raise PlanilhaInvalida(f"{caminho.name}, linha {numero}: falta o participante.")
        if participante in pontuacoes:
            raise PlanilhaInvalida(
                f"{caminho.name}, linha {numero}: {participante} aparece duas vezes."
            )
        try:
            respostas = [int(linha[item]) for item in ITENS]
            pontuacoes[participante] = pontuacao_sus(respostas)
        except ValueError as erro:
            raise PlanilhaInvalida(f"{caminho.name}, linha {numero}: {erro}") from None
    if not pontuacoes:
        raise PlanilhaInvalida(f"{caminho.name}: nenhuma resposta preenchida.")
    return pontuacoes


@dataclass
class Execucao:
    participante: str
    tarefa: str
    situacao: str  # sim | ajuda | nao
    tempo_s: float
    erros: int
    toques: int | None


def ler_tarefas(caminho: Path) -> list[Execucao]:
    execucoes = []
    colunas = ["participante", "tarefa", "concluiu", "tempo_s", "erros"]
    for numero, linha in _ler_csv(caminho, colunas):
        situacao = linha["concluiu"].lower().replace("ã", "a")
        if situacao not in SITUACOES:
            raise PlanilhaInvalida(
                f"{caminho.name}, linha {numero}: 'concluiu' deve ser sim, ajuda ou nao."
            )
        try:
            toques = linha.get("toques", "")
            execucoes.append(
                Execucao(
                    participante=linha["participante"],
                    tarefa=linha["tarefa"],
                    situacao=situacao,
                    tempo_s=float(linha["tempo_s"].replace(",", ".")),
                    erros=int(linha["erros"]),
                    toques=int(toques) if toques else None,
                )
            )
        except ValueError:
            raise PlanilhaInvalida(
                f"{caminho.name}, linha {numero}: tempo_s, erros e toques devem ser números."
            ) from None
    return execucoes


def _numero(valor: float, casas: int = 1) -> str:
    """Formato brasileiro: vírgula decimal."""
    return f"{valor:.{casas}f}".replace(".", ",")


def relatorio_sus(pontuacoes: dict[str, float]) -> str:
    valores = list(pontuacoes.values())
    media = statistics.mean(valores)
    desvio = statistics.stdev(valores) if len(valores) > 1 else 0.0
    acima = sum(v >= META_SUS for v in valores)
    linhas = [
        "## Pontuação SUS",
        "",
        "| Participante | SUS |",
        "|--------------|-----|",
        *(f"| {p} | {_numero(v)} |" for p, v in pontuacoes.items()),
        "",
        f"- Participantes: {len(valores)}",
        f"- Média: **{_numero(media)}** (desvio padrão {_numero(desvio)};"
        f" mínimo {_numero(min(valores))}, máximo {_numero(max(valores))})",
        f"- Com pontuação ≥ {_numero(META_SUS, 0)}: {acima} de {len(valores)}",
        f"- RNF03 (média SUS ≥ {_numero(META_SUS, 0)}): "
        + ("**atendido**" if media >= META_SUS else "**não atendido**"),
    ]
    return "\n".join(linhas)


def relatorio_tarefas(execucoes: list[Execucao]) -> str:
    linhas = [
        "## Tarefas",
        "",
        "| Tarefa | Participantes | Concluíram sozinhos | Com ajuda | Tempo médio (s)"
        " | Erros por participante | Toques até a rota |",
        "|--------|---------------|---------------------|-----------|-----------------"
        "|------------------------|-------------------|",
    ]
    tarefas = list(dict.fromkeys(e.tarefa for e in execucoes))
    for tarefa in tarefas:
        grupo = [e for e in execucoes if e.tarefa == tarefa]
        total = len(grupo)
        sozinhos = sum(e.situacao == "sim" for e in grupo)
        ajuda = sum(e.situacao == "ajuda" for e in grupo)
        # O tempo médio considera só quem concluiu, com ou sem ajuda.
        tempos = [e.tempo_s for e in grupo if e.situacao != "nao"]
        tempo = _numero(statistics.mean(tempos)) if tempos else "—"
        erros = _numero(statistics.mean(e.erros for e in grupo))
        toques = [e.toques for e in grupo if e.toques is not None and e.situacao != "nao"]
        if toques:
            dentro = sum(t <= META_TOQUES for t in toques)
            coluna_toques = (
                f"média {_numero(statistics.mean(toques))}; "
                f"≤ {META_TOQUES} em {dentro} de {len(toques)}"
            )
        else:
            coluna_toques = "—"
        linhas.append(
            f"| {tarefa} | {total} | {sozinhos} ({_numero(100 * sozinhos / total, 0)}%)"
            f" | {ajuda} | {tempo} | {erros} | {coluna_toques} |"
        )
    concluidas = sum(e.situacao == "sim" for e in execucoes)
    linhas += [
        "",
        f"- Taxa de conclusão sem ajuda, todas as tarefas: "
        f"**{_numero(100 * concluidas / len(execucoes), 0)}%** "
        f"({concluidas} de {len(execucoes)} execuções)",
    ]
    return "\n".join(linhas)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("sus", type=Path, help="CSV com participante,q1,...,q10")
    parser.add_argument(
        "--tarefas", type=Path, help="CSV com participante,tarefa,concluiu,tempo_s,erros,toques"
    )
    args = parser.parse_args(argv)
    try:
        partes = [relatorio_sus(ler_sus(args.sus))]
        if args.tarefas:
            execucoes = ler_tarefas(args.tarefas)
            if execucoes:
                partes.append(relatorio_tarefas(execucoes))
    except PlanilhaInvalida as erro:
        print(f"Erro: {erro}", file=sys.stderr)
        return 1
    print("\n\n".join(partes))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
