from app.core.senha import problemas_da_senha


def test_senha_forte_nao_tem_problemas():
    assert problemas_da_senha("Viagem@2026") == []


def test_aceita_acentos_e_qualquer_caractere_especial():
    assert problemas_da_senha("Ônibus_à_noite") == []


def test_espaco_nao_conta_como_caractere_especial():
    assert "ter um caractere especial (como ! @ # -)" in problemas_da_senha("Senha Forte")


def test_senha_so_de_numeros_lista_tudo_o_que_falta():
    assert problemas_da_senha("1234") == [
        "ter pelo menos 8 caracteres",
        "ter uma letra maiúscula",
        "ter uma letra minúscula",
        "ter um caractere especial (como ! @ # -)",
    ]
