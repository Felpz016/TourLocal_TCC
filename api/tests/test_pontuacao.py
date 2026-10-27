import pytest

from app.models import Estabelecimento, Perfil
from app.models.enums import FaixaPreco
from app.services.pontuacao import (
    Pesos,
    nota_avaliacao,
    nota_orcamento,
    nota_perfil,
    nota_proximidade,
    pontuar,
)


def test_pesos_precisam_somar_um():
    Pesos(0.4, 0.3, 0.2, 0.1)
    with pytest.raises(ValueError):
        Pesos(0.5, 0.5, 0.5, 0.5)


def test_proximidade_vai_de_1_no_usuario_a_0_na_borda_do_raio():
    assert nota_proximidade(0, 3) == 1
    assert nota_proximidade(1.5, 3) == 0.5
    assert nota_proximidade(3, 3) == 0


def test_avaliacao_neutra_sem_notas():
    assert nota_avaliacao(None) == 0.5
    assert nota_avaliacao(5) == 1 and nota_avaliacao(1) == 0


def test_orcamento():
    E, M, A = FaixaPreco.ECONOMICO, FaixaPreco.MODERADO, FaixaPreco.ALTO
    assert nota_orcamento(E, M) == 1  # mais barato que o orçamento
    assert nota_orcamento(M, M) == 1
    assert nota_orcamento(A, M) == 0.3
    assert nota_orcamento(A, E) == 0
    assert nota_orcamento(None, M) == 0.5 and nota_orcamento(M, None) == 0.5


def _estab(**kw):
    return Estabelecimento(
        nome="X", acessibilidade=kw.get("acessivel", False), opcoes_alimentares=kw.get("opcoes")
    )


def test_perfil_considera_dieta_tempo_e_acessibilidade():
    perfil = Perfil(
        restricoes_alimentares="vegetariano,vegano",
        tempo_disponivel_min=120,
        necessita_acessibilidade=True,
    )
    estab = _estab(acessivel=True, opcoes="vegetariano")
    # dieta 1/2, tempo 10 min de 120 (bem perto) = 1, acessível = 1 -> média 0,833
    assert nota_perfil(estab, perfil, minutos_a_pe=10, eixo_comer=True) == pytest.approx(
        0.8333, abs=1e-3
    )
    # fora do eixo Comer a dieta não conta
    assert nota_perfil(estab, perfil, minutos_a_pe=10, eixo_comer=False) == 1
    # ida a pé de metade do tempo disponível ou mais zera o critério de tempo
    assert (
        nota_perfil(_estab(), Perfil(tempo_disponivel_min=60), minutos_a_pe=30, eixo_comer=False)
        == 0
    )


def test_sem_perfil_tudo_neutro_e_pesos_padrao():
    resultado = pontuar(
        _estab(),
        distancia_km=0,
        raio_km=3,
        nota_media=None,
        minutos_a_pe=1,
        perfil=None,
        eixo_comer=True,
    )
    # 0,35·1 + 0,25·0,5 + 0,20·0,5 + 0,20·0,5
    assert resultado.total == pytest.approx(0.675)


def test_motivos_explicam_a_recomendacao():
    perfil = Perfil(
        faixa_orcamento=FaixaPreco.MODERADO,
        restricoes_alimentares="vegano",
        necessita_acessibilidade=True,
    )
    estab = _estab(acessivel=True, opcoes="vegano")
    estab.faixa_preco = FaixaPreco.ECONOMICO
    motivos = pontuar(estab, 0.3, 3, 4.6, 4, perfil, eixo_comer=True).motivos
    assert motivos == [
        "A 4 min a pé de você",
        "Bem avaliado (nota 4,6)",
        "Dentro do seu orçamento",
        "Tem opção vegana",
        "Acessível para cadeira de rodas",
    ]


def test_sem_destaque_o_motivo_e_a_distancia():
    assert pontuar(_estab(), 2.5, 3, None, 33, None, eixo_comer=False).motivos == [
        "A 2,5 km de você"
    ]
