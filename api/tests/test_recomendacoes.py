from datetime import datetime, time
from decimal import Decimal

import pytest

from app.models import Avaliacao, Estabelecimento, HorarioFuncionamento, Usuario
from app.models.enums import FaixaPreco, StatusAvaliacao, TipoUsuario
from app.services import recomendacao
from app.services.categorias import garantir_categorias
from tests.conftest import cadastrar_e_logar

# Ponto do usuário: centro de Araraquara.
LAT, LNG = -21.7946, -48.1756
TERCA_12H = datetime(2026, 10, 27, 12, 0)


@pytest.fixture
def lugares(db):
    categorias = garantir_categorias(db)

    def criar(nome, dlat, categoria, verificado=True, horario=None):
        estab = Estabelecimento(
            nome=nome,
            endereco="Rua X",
            latitude=Decimal(str(round(LAT + dlat, 6))),
            longitude=Decimal(str(LNG)),
            verificado=verificado,
            categorias=[categorias[categoria]],
        )
        if horario:
            estab.horarios = [
                HorarioFuncionamento(
                    dia_semana=d, hora_abertura=horario[0], hora_fechamento=horario[1]
                )
                for d in range(7)
            ]
        db.add(estab)
        return estab

    # 0,009 grau de latitude é cerca de 1 km.
    perto = criar("Perto", 0.009, "Restaurante", horario=(time(11), time(15)))
    criar("Mais longe", 0.025, "Lanchonete")
    criar("Fechado agora", 0.018, "Restaurante", horario=(time(18), time(23)))
    criar("Sem verificação", 0.005, "Restaurante", verificado=False)
    criar("Fora do raio", 0.09, "Restaurante")
    criar("Hotel", 0.004, "Hotel")
    autor = Usuario(nome="A", email="a@a.com", senha_hash="x", tipo=TipoUsuario.TURISTA)
    outro = Usuario(nome="B", email="b@b.com", senha_hash="x", tipo=TipoUsuario.TURISTA)
    db.add_all([autor, outro])
    db.flush()
    db.add_all(
        [
            Avaliacao(id_usuario=autor.id_usuario, id_estab=perto.id_estab, nota=4),
            Avaliacao(
                id_usuario=outro.id_usuario,
                id_estab=perto.id_estab,
                nota=1,
                status=StatusAvaliacao.DENUNCIADA,
            ),
        ]
    )
    db.commit()


@pytest.fixture
def meio_dia(monkeypatch):
    original = recomendacao.recomendar

    def com_horario_fixo(*args, **kwargs):
        kwargs.setdefault("agora", TERCA_12H)
        return original(*args, **kwargs)

    monkeypatch.setattr(recomendacao, "recomendar", com_horario_fixo)


def _consultar(client, headers, **params):
    params = {"eixo": "comer", "lat": LAT, "lng": LNG, **params}
    return client.get("/recomendacoes", params=params, headers=headers)


def test_lista_do_eixo_por_distancia_dentro_do_raio_padrao(client, lugares, meio_dia):
    headers = cadastrar_e_logar(client)
    corpo = _consultar(client, headers).json()
    assert corpo["raio_km"] == 3.0
    # Sem "Fechado agora" (RN02), sem "Sem verificação" (RN01), sem "Fora do raio" e sem o hotel.
    assert [r["nome"] for r in corpo["resultados"]] == ["Perto", "Mais longe"]


def test_resultado_traz_distancia_tempo_horario_e_nota(client, lugares, meio_dia):
    headers = cadastrar_e_logar(client)
    perto = _consultar(client, headers).json()["resultados"][0]
    assert perto["distancia_km"] == pytest.approx(1.0, abs=0.05)
    assert perto["minutos_a_pe"] == 13
    assert perto["minutos_de_carro"] == 2
    assert perto["aberto_agora"] is True
    assert perto["categorias"] == ["Restaurante"]
    # A avaliação denunciada não entra na média (RN06).
    assert perto["nota_media"] == 4.0 and perto["total_avaliacoes"] == 1


def test_incluir_fechados_mostra_os_fechados(client, lugares, meio_dia):
    headers = cadastrar_e_logar(client)
    nomes = [
        r["nome"] for r in _consultar(client, headers, incluir_fechados=True).json()["resultados"]
    ]
    assert nomes == ["Perto", "Fechado agora", "Mais longe"]


def test_raio_vem_do_perfil_do_turista(client, lugares, meio_dia):
    headers = cadastrar_e_logar(client)
    client.put("/perfil", json={"raio_busca_km": "1.5"}, headers=headers)
    corpo = _consultar(client, headers).json()
    assert corpo["raio_km"] == 1.5
    assert [r["nome"] for r in corpo["resultados"]] == ["Perto"]


def test_outro_eixo(client, lugares, meio_dia):
    headers = cadastrar_e_logar(client)
    nomes = [r["nome"] for r in _consultar(client, headers, eixo="ficar").json()["resultados"]]
    assert nomes == ["Hotel"]


def test_raio_acima_do_maximo_e_recusado(client, lugares):
    headers = cadastrar_e_logar(client)
    assert _consultar(client, headers, raio_km=25).status_code == 422


def test_exige_login(client):
    assert (
        client.get("/recomendacoes", params={"eixo": "comer", "lat": 0, "lng": 0}).status_code
        == 401
    )


@pytest.fixture
def com_detalhes(db, lugares):
    """Acrescenta preço, acessibilidade e notas aos lugares do fixture `lugares`."""
    from sqlalchemy import select

    estabs = {e.nome: e for e in db.scalars(select(Estabelecimento))}
    estabs["Perto"].faixa_preco = FaixaPreco.ALTO
    estabs["Mais longe"].faixa_preco = FaixaPreco.ECONOMICO
    estabs["Mais longe"].acessibilidade = True
    estabs["Mais longe"].opcoes_alimentares = "vegetariano"
    autores = [
        Usuario(nome=f"U{i}", email=f"u{i}@a.com", senha_hash="x", tipo=TipoUsuario.TURISTA)
        for i in range(3)
    ]
    db.add_all(autores)
    db.flush()
    db.add_all(
        Avaliacao(id_usuario=u.id_usuario, id_estab=estabs["Mais longe"].id_estab, nota=5)
        for u in autores
    )
    db.commit()


def test_pontuacao_ordena_e_explica(client, com_detalhes, meio_dia):
    headers = cadastrar_e_logar(client)
    client.put(
        "/perfil",
        json={"faixa_orcamento": "economico", "restricoes_alimentares": ["vegetariano"]},
        headers=headers,
    )
    resultados = _consultar(client, headers).json()["resultados"]
    # "Mais longe" está a 2,8 km, mas é barato, bem avaliado e tem opção vegetariana.
    assert [r["nome"] for r in resultados] == ["Mais longe", "Perto"]
    primeiro = resultados[0]
    assert primeiro["pontuacao"] > resultados[1]["pontuacao"]
    assert set(primeiro["criterios"]) == {"proximidade", "avaliacao", "orcamento", "perfil"}
    assert "Tem opção vegetariana" in primeiro["motivos"]
    assert "Dentro do seu orçamento" in primeiro["motivos"]


def test_acessibilidade_e_obrigatoria_para_quem_precisa(client, com_detalhes, meio_dia):
    headers = cadastrar_e_logar(client)
    client.put("/perfil", json={"necessita_acessibilidade": True}, headers=headers)
    assert [r["nome"] for r in _consultar(client, headers).json()["resultados"]] == ["Mais longe"]


def test_filtros_de_categoria_preco_e_nota(client, com_detalhes, meio_dia):
    headers = cadastrar_e_logar(client)
    nomes = lambda **p: [r["nome"] for r in _consultar(client, headers, **p).json()["resultados"]]  # noqa: E731
    assert nomes(categoria="Restaurante") == ["Perto"]
    assert nomes(faixa_preco=["economico", "moderado"]) == ["Mais longe"]
    assert nomes(nota_minima=4.5) == ["Mais longe"]
    assert nomes(nota_minima=4.5, categoria="Restaurante") == []


def test_sem_resultados_sugere_raio_maior(client, lugares, meio_dia):
    headers = cadastrar_e_logar(client)
    corpo = _consultar(client, headers, eixo="fazer").json()
    assert corpo["resultados"] == [] and corpo["raio_sugerido_km"] == 6.0
    corpo = _consultar(client, headers, eixo="fazer", raio_km=20).json()
    assert corpo["raio_sugerido_km"] is None


def test_lista_categorias_do_eixo(client, lugares):
    headers = cadastrar_e_logar(client)
    nomes = [c["nome"] for c in client.get("/categorias?eixo=ficar", headers=headers).json()]
    assert nomes == ["Hostel", "Hotel", "Motel", "Pousada"]


def test_busca_por_nome_ignora_acentos_e_maiusculas(client, db, lugares, meio_dia):
    from sqlalchemy import select

    db.scalars(
        select(Estabelecimento).where(Estabelecimento.nome == "Perto")
    ).one().nome = "Café São Bento"
    db.commit()
    headers = cadastrar_e_logar(client)
    nomes = lambda **p: [r["nome"] for r in _consultar(client, headers, **p).json()["resultados"]]  # noqa: E731
    assert nomes(busca="cafe sao") == ["Café São Bento"]
    assert nomes(busca="  BENTO ") == ["Café São Bento"]
    # Também procura na categoria.
    assert nomes(busca="lanchonete") == ["Mais longe"]
    assert nomes(busca="pizzaria") == []


def test_busca_inclui_fechados_e_usa_o_raio_maximo(client, lugares, meio_dia):
    headers = cadastrar_e_logar(client)
    corpo = _consultar(client, headers, busca="fechado").json()
    assert corpo["raio_km"] == 20.0
    assert [r["nome"] for r in corpo["resultados"]] == ["Fechado agora"]
    # "Fora do raio" fica a 10 km: fora dos 3 km do perfil, mas dentro da cidade.
    assert [r["nome"] for r in _consultar(client, headers, busca="fora").json()["resultados"]] == [
        "Fora do raio"
    ]
