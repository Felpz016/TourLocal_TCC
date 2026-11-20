"""Filtros de categoria, faixa de preço e acessibilidade aplicados na consulta (RNF01, RF09)."""

from datetime import datetime
from decimal import Decimal

from app.models import Estabelecimento
from app.models.enums import Eixo, FaixaPreco
from app.services import recomendacao
from app.services.categorias import garantir_categorias
from tests.conftest import cadastrar_e_logar

LAT, LNG = -21.7946, -48.1756
TERCA_12H = datetime(2026, 10, 27, 12, 0)


def _criar(db, categorias, nome, nomes_categorias, preco=None, acessivel=False):
    estab = Estabelecimento(
        nome=nome,
        endereco="Rua X",
        latitude=Decimal(str(LAT + 0.005)),
        longitude=Decimal(str(LNG)),
        verificado=True,
        faixa_preco=preco,
        acessibilidade=acessivel,
        categorias=[categorias[c] for c in nomes_categorias],
    )
    db.add(estab)
    return estab


def _popular(db):
    categorias = garantir_categorias(db)
    _criar(db, categorias, "Bar barato", ["Bar"], FaixaPreco.ECONOMICO, acessivel=True)
    _criar(db, categorias, "Restaurante caro", ["Restaurante"], FaixaPreco.ALTO)
    _criar(db, categorias, "Restaurante e bar", ["Restaurante", "Bar"], FaixaPreco.MODERADO)
    _criar(db, categorias, "Sem preço", ["Lanchonete"], None, acessivel=True)
    db.commit()


def _nomes(db, filtros, so_acessiveis=False):
    candidatos = recomendacao.filtrar_por_raio(
        db, Eixo.COMER, LAT, LNG, 5, TERCA_12H, filtros, so_acessiveis
    )
    return sorted(estab.nome for estab, _, _ in candidatos)


def test_a_consulta_ja_devolve_so_os_lugares_dos_filtros(db):
    _popular(db)
    todos = ["Bar barato", "Restaurante caro", "Restaurante e bar", "Sem preço"]
    assert _nomes(db, recomendacao.Filtros()) == todos
    assert _nomes(db, recomendacao.Filtros(categoria="Bar")) == ["Bar barato", "Restaurante e bar"]
    assert _nomes(
        db, recomendacao.Filtros(faixas_preco=[FaixaPreco.ALTO, FaixaPreco.MODERADO])
    ) == ["Restaurante caro", "Restaurante e bar"]
    assert _nomes(db, recomendacao.Filtros(), so_acessiveis=True) == ["Bar barato", "Sem preço"]
    assert _nomes(
        db,
        recomendacao.Filtros(categoria="Bar", faixas_preco=[FaixaPreco.ECONOMICO]),
        so_acessiveis=True,
    ) == ["Bar barato"]
    # Categoria de outro eixo: nenhum lugar de "comer" tem "Museu".
    assert _nomes(db, recomendacao.Filtros(categoria="Museu")) == []


def test_filtro_por_categoria_mantem_todas_as_categorias_no_cartao(client, db, monkeypatch):
    """O filtro escolhe os lugares, mas o cartão continua mostrando todas as categorias."""
    _popular(db)
    original = recomendacao.recomendar
    monkeypatch.setattr(
        recomendacao,
        "recomendar",
        lambda *a, **k: original(*a, **{**k, "agora": TERCA_12H}),
    )
    headers = cadastrar_e_logar(client)
    resposta = client.get(
        "/recomendacoes",
        params={"eixo": "comer", "lat": LAT, "lng": LNG, "categoria": "Bar"},
        headers=headers,
    )
    assert resposta.status_code == 200
    categorias = {r["nome"]: sorted(r["categorias"]) for r in resposta.json()["resultados"]}
    assert categorias == {"Bar barato": ["Bar"], "Restaurante e bar": ["Bar", "Restaurante"]}
