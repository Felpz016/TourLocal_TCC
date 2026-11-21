"""Cálculo do SUS e das métricas do teste de usabilidade (RNF03, docs/teste-usabilidade.md)."""

from pathlib import Path

import pytest

from app.usabilidade.sus import (
    PlanilhaInvalida,
    ler_sus,
    ler_tarefas,
    main,
    pontuacao_sus,
    relatorio_sus,
    relatorio_tarefas,
)

EXEMPLOS = Path(__file__).resolve().parents[2] / "docs" / "usabilidade"


def test_extremos_da_escala():
    # Concorda com tudo de positivo e discorda de tudo de negativo: 100.
    assert pontuacao_sus([5, 1] * 5) == 100.0
    # O contrário: 0.
    assert pontuacao_sus([1, 5] * 5) == 0.0
    # Neutro em tudo: 50.
    assert pontuacao_sus([3] * 10) == 50.0


def test_itens_pares_sao_invertidos():
    # Exemplo calculado à mão: ímpares (3-1)+(4-1)+(4-1)+(4-1)+(3-1) = 13,
    # pares (5-2)+(5-2)+(5-2)+(5-2)+(5-3) = 14; (13 + 14) × 2,5 = 67,5.
    assert pontuacao_sus([3, 2, 4, 2, 4, 2, 4, 2, 3, 3]) == 67.5


@pytest.mark.parametrize("respostas", [[3] * 9, [3] * 11, [0] + [3] * 9, [6] + [3] * 9])
def test_recusa_respostas_invalidas(respostas):
    with pytest.raises(ValueError):
        pontuacao_sus(respostas)


def test_exemplo_do_repositorio_calcula_media_e_rnf03():
    pontuacoes = ler_sus(EXEMPLOS / "exemplo-ficticio-sus.csv")
    assert pontuacoes == {"P01": 85.0, "P02": 67.5, "P03": 100.0, "P04": 60.0, "P05": 82.5}
    texto = relatorio_sus(pontuacoes)
    assert "Média: **79,0**" in texto
    assert "Com pontuação ≥ 68: 3 de 5" in texto
    assert "**atendido**" in texto


def test_media_abaixo_de_68_nao_atende():
    texto = relatorio_sus({"P01": 60.0, "P02": 70.0})
    assert "Média: **65,0**" in texto
    assert "**não atendido**" in texto


def test_tarefas_taxa_de_conclusao_tempo_e_toques():
    execucoes = ler_tarefas(EXEMPLOS / "exemplo-ficticio-tarefas.csv")
    texto = relatorio_tarefas(execucoes)
    # T1: três concluíram sozinhos, em 2, 3 e 2 toques (RNF03: até 3).
    assert "| T1 Rota de um almoço aberto | 3 | 3 (100%) | 0 | 52,7 | 0,3 |" in texto
    assert "≤ 3 em 3 de 3" in texto
    # T3: P03 não concluiu; o tempo médio considera só quem concluiu (25 e 30 s).
    assert "| T3 Buscar pelo nome | 3 | 2 (67%) | 0 | 27,5 | 1,3 | — |" in texto
    assert "**78%** (7 de 9 execuções)" in texto


def test_planilha_com_erro_indica_a_linha(tmp_path):
    arquivo = tmp_path / "sus.csv"
    arquivo.write_text(
        "participante,q1,q2,q3,q4,q5,q6,q7,q8,q9,q10\nP01,5,1,5,1,5,1,5,1,5,1\nP02,5,1,5,1,5,1,5,1,5,7\n",
        encoding="utf-8",
    )
    with pytest.raises(PlanilhaInvalida, match="linha 3"):
        ler_sus(arquivo)


def test_participante_repetido_e_recusado(tmp_path):
    arquivo = tmp_path / "sus.csv"
    linha = "P01,3,3,3,3,3,3,3,3,3,3\n"
    arquivo.write_text("participante," + ",".join(f"q{i}" for i in range(1, 11)) + "\n" + linha * 2)
    with pytest.raises(PlanilhaInvalida, match="duas vezes"):
        ler_sus(arquivo)


def test_linha_de_comando(capsys):
    codigo = main(
        [
            str(EXEMPLOS / "exemplo-ficticio-sus.csv"),
            "--tarefas",
            str(EXEMPLOS / "exemplo-ficticio-tarefas.csv"),
        ]
    )
    saida = capsys.readouterr().out
    assert codigo == 0
    assert "## Pontuação SUS" in saida and "## Tarefas" in saida


def test_linha_de_comando_com_planilha_errada(tmp_path, capsys):
    arquivo = tmp_path / "sus.csv"
    arquivo.write_text("participante,q1\nP01,3\n", encoding="utf-8")
    assert main([str(arquivo)]) == 1
    assert "faltam as colunas" in capsys.readouterr().err
