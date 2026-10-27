from tests.conftest import cadastrar_e_logar


def test_perfil_sem_preferencias_usa_raio_padrao_de_3_km(client):
    headers = cadastrar_e_logar(client)
    resposta = client.get("/perfil", headers=headers)
    assert resposta.status_code == 200
    assert resposta.json()["raio_busca_km"] == "3.0"


def test_salvar_e_ler_preferencias(client):
    headers = cadastrar_e_logar(client)
    preferencias = {
        "faixa_orcamento": "economico",
        "restricoes_alimentares": ["Vegetariano", "sem_gluten", "vegetariano"],
        "necessita_acessibilidade": True,
        "tempo_disponivel_min": 120,
        "raio_busca_km": "5",
    }
    assert client.put("/perfil", json=preferencias, headers=headers).status_code == 200

    perfil = client.get("/perfil", headers=headers).json()
    assert perfil["faixa_orcamento"] == "economico"
    assert perfil["restricoes_alimentares"] == ["sem_gluten", "vegetariano"]
    assert perfil["necessita_acessibilidade"] is True
    assert perfil["tempo_disponivel_min"] == 120
    assert perfil["raio_busca_km"] == "5.0"


def test_raio_acima_de_20_km_e_recusado(client):
    headers = cadastrar_e_logar(client)
    resposta = client.put("/perfil", json={"raio_busca_km": "25"}, headers=headers)
    assert resposta.status_code == 422


def test_comerciante_nao_tem_perfil_de_preferencias(client):
    headers = cadastrar_e_logar(client, email="loja@exemplo.com", tipo="comerciante")
    assert client.get("/perfil", headers=headers).status_code == 403
