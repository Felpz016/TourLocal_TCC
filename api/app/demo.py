"""Dados de demonstração em Araraquara, para apresentar o app sem depender de importação.

Cria três contas (turista, comerciante e administrador) e lugares fictícios no centro, com
horários, preços, acessibilidade, opções alimentares e avaliações, nos três eixos. Um dos
lugares fica "aguardando verificação" para mostrar a moderação. Pode rodar mais de uma vez:
os lugares são reconhecidos pelo campo origem_externa ("demo:...") e atualizados.

    python -m app.demo            # cria ou atualiza
    python -m app.demo --limpar   # apaga os lugares e as contas de demonstração

Roteiro da apresentação: docs/roteiro-demonstracao.md.
"""

import argparse
from dataclasses import dataclass, field
from datetime import time
from decimal import Decimal

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.security import gerar_hash_senha
from app.db.session import SessionLocal
from app.models import (
    Avaliacao,
    Estabelecimento,
    Favorito,
    HorarioFuncionamento,
    Perfil,
    Usuario,
)
from app.models.enums import FaixaPreco, TipoUsuario
from app.services.categorias import garantir_categorias

# Senha das contas de demonstração; segue a regra de senha forte (RF01).
SENHA = "Demo@2026"
CONTAS = {
    "turista": ("Ana Turista", "turista@demo.tourlocal.app", TipoUsuario.TURISTA),
    "comerciante": (
        "Carlos Comerciante",
        "comerciante@demo.tourlocal.app",
        TipoUsuario.COMERCIANTE,
    ),
    "admin": ("Admin Demo", "admin@demo.tourlocal.app", TipoUsuario.ADMINISTRADOR),
}
# Quem "escreveu" as avaliações de exemplo.
AVALIADORES = [
    ("Bruna", "bruna@demo.tourlocal.app"),
    ("Diego", "diego@demo.tourlocal.app"),
    ("Elisa", "elisa@demo.tourlocal.app"),
]

# Centro de Araraquara (Praça Pedro de Toledo, aproximadamente).
CENTRO = (-21.7946, -48.1756)

TODO_DIA = [(time(7), time(23))]
COMERCIAL = [(time(9), time(18))]
NOITE = [(time(18), time(2))]


@dataclass
class Lugar:
    chave: str
    nome: str
    categoria: str
    # Deslocamento em relação ao centro, em graus (0,009 grau ≈ 1 km).
    dlat: float
    dlng: float
    endereco: str
    descricao: str
    preco: FaixaPreco | None = None
    acessivel: bool = False
    dietas: str | None = None
    horarios: list[tuple[time, time]] = field(default_factory=lambda: TODO_DIA)
    notas: list[tuple[int, str]] = field(default_factory=list)
    verificado: bool = True
    do_comerciante: bool = False


LUGARES = [
    # Onde comer
    Lugar(
        "cantina",
        "Cantina Nonna Lúcia",
        "Restaurante",
        0.002,
        0.001,
        "Rua São Bento, 820 - Centro",
        "Massas frescas feitas na casa e molho de tomate de panela, como na casa da avó.",
        FaixaPreco.MODERADO,
        True,
        "vegetariano",
        TODO_DIA,
        [(5, "Melhor lasanha da cidade."), (4, "Porção bem servida."), (5, "Atendimento ótimo.")],
        do_comerciante=True,
    ),
    Lugar(
        "cafe",
        "Café da Praça",
        "Cafeteria",
        -0.001,
        0.002,
        "Av. Duque de Caxias, 410 - Centro",
        "Café coado, pão de queijo e bolos do dia, com mesas na calçada.",
        FaixaPreco.ECONOMICO,
        True,
        "vegetariano,sem_lactose",
        [(time(7), time(20))],
        [(5, "Pão de queijo quentinho."), (4, "Bom para trabalhar.")],
    ),
    Lugar(
        "verde",
        "Verde Raiz",
        "Restaurante",
        0.006,
        -0.004,
        "Rua Voluntários da Pátria, 1530 - Centro",
        "Comida vegana por quilo, com opções sem glúten todos os dias.",
        FaixaPreco.ECONOMICO,
        False,
        "vegano,vegetariano,sem_gluten",
        [(time(11), time(23))],
        [(5, "Vegano sem ser sem graça."), (4, "Preço justo.")],
    ),
    Lugar(
        "lanche",
        "Lanches do Zé",
        "Lanchonete",
        -0.008,
        -0.003,
        "Av. Bento de Abreu, 2010 - Vila Xavier",
        "Lanche de pernil e suco natural desde 1998.",
        FaixaPreco.ECONOMICO,
        False,
        None,
        TODO_DIA,
        [(4, "Pernil caprichado."), (3, "Demora no fim de semana.")],
    ),
    Lugar(
        "sorvete",
        "Gelato Morada do Sol",
        "Sorveteria",
        0.004,
        0.006,
        "Rua Gonçalves Dias, 300 - Centro",
        "Gelato artesanal com frutas da região e sabores sem lactose.",
        FaixaPreco.MODERADO,
        True,
        "sem_lactose",
        [(time(12), time(23))],
        [(5, "O de jabuticaba é incrível.")],
    ),
    Lugar(
        "bar",
        "Bar do Trilho",
        "Bar",
        -0.012,
        0.009,
        "Rua Padre Duarte, 77 - Centro",
        "Bar de esquina com música ao vivo às sextas e petiscos.",
        FaixaPreco.MODERADO,
        False,
        None,
        NOITE,
        [(4, "Bom para ir com amigos."), (4, "Chope gelado.")],
    ),
    Lugar(
        "bistro",
        "Bistrô Laranjeiras",
        "Restaurante",
        0.015,
        0.012,
        "Av. Maria Antônia Camargo de Oliveira, 900 - Jardim Primavera",
        "Cozinha contemporânea com menu degustação.",
        FaixaPreco.ALTO,
        True,
        "vegetariano,sem_gluten",
        [(time(12), time(23))],
        [(5, "Ótimo para ocasiões especiais."), (5, "Menu degustação vale cada centavo.")],
    ),
    # Onde ficar
    Lugar(
        "hotel",
        "Hotel Morada do Sol",
        "Hotel",
        0.003,
        -0.002,
        "Av. Portugal, 1200 - Centro",
        "Hotel no centro, com café da manhã e estacionamento.",
        FaixaPreco.MODERADO,
        True,
        None,
        [(time(0), time(0))],
        [(4, "Quarto limpo e café bom."), (5, "Localização perfeita.")],
    ),
    Lugar(
        "pousada",
        "Pousada Casa Amarela",
        "Pousada",
        -0.006,
        0.007,
        "Rua Itália, 455 - Vila Santana",
        "Casarão restaurado com seis quartos e jardim.",
        FaixaPreco.ECONOMICO,
        False,
        None,
        [(time(0), time(0))],
        [(5, "Aconchegante e silenciosa.")],
    ),
    Lugar(
        "hostel",
        "Hostel Ferroviário",
        "Hostel",
        -0.013,
        0.004,
        "Rua Carlos Gomes, 1800 - Centro",
        "Quartos compartilhados perto da antiga estação de trem.",
        FaixaPreco.ECONOMICO,
        False,
        None,
        [(time(0), time(0))],
        [(4, "Ótimo custo-benefício.")],
    ),
    Lugar(
        "novo",
        "Hotel Boulevard Novo",
        "Hotel",
        0.009,
        0.008,
        "Av. Brasil, 2500 - Centro",
        "Cadastrado pelo comerciante e ainda aguardando a verificação do administrador.",
        FaixaPreco.ALTO,
        True,
        None,
        [(time(0), time(0))],
        verificado=False,
        do_comerciante=True,
    ),
    # O que fazer
    Lugar(
        "parque",
        "Parque Ecológico Municipal",
        "Parque",
        0.02,
        -0.015,
        "Av. Alberto Benassi, s/n",
        "Trilhas, lago e área de piquenique. Bom para o fim da tarde.",
        None,
        True,
        None,
        [(time(6), time(18))],
        [(5, "Lindo no pôr do sol."), (4, "Leve repelente.")],
    ),
    Lugar(
        "museu",
        "Museu da Ferrovia",
        "Museu",
        -0.011,
        0.005,
        "Rua Carlos Gomes, 1700 - Centro",
        "Locomotivas e a história da ferrovia que fez a cidade crescer.",
        FaixaPreco.ECONOMICO,
        True,
        None,
        COMERCIAL,
        [(5, "As crianças adoraram."), (4, "Monitores muito bons.")],
    ),
    Lugar(
        "teatro",
        "Teatro Municipal",
        "Teatro",
        0.001,
        0.004,
        "Av. Feijó, 640 - Centro",
        "Programação de teatro e música; ingressos na bilheteria.",
        FaixaPreco.MODERADO,
        True,
        None,
        [(time(14), time(23))],
        [(5, "Acústica excelente.")],
    ),
    Lugar(
        "mirante",
        "Mirante do Pôr do Sol",
        "Mirante",
        0.03,
        0.02,
        "Estrada Municipal, km 3",
        "Vista da cidade inteira; vá no fim da tarde.",
        None,
        False,
        None,
        [(time(6), time(22))],
        [(5, "Vista incrível.")],
    ),
]


def _conta(db: Session, nome: str, email: str, tipo: TipoUsuario) -> Usuario:
    usuario = db.scalar(select(Usuario).where(Usuario.email == email))
    if not usuario:
        usuario = Usuario(nome=nome, email=email, senha_hash=gerar_hash_senha(SENHA), tipo=tipo)
        db.add(usuario)
        db.flush()
    return usuario


def criar(db: Session) -> None:
    categorias = garantir_categorias(db)
    contas = {chave: _conta(db, *dados) for chave, dados in CONTAS.items()}
    avaliadores = [_conta(db, n, e, TipoUsuario.TURISTA) for n, e in AVALIADORES]
    # Preferências da turista de demonstração: orçamento econômico e comida vegetariana, para
    # os cartões mostrarem motivos como "Dentro do seu orçamento" e "Tem opção vegetariana".
    perfil = contas["turista"].perfil or Perfil(id_usuario=contas["turista"].id_usuario)
    perfil.faixa_orcamento = FaixaPreco.ECONOMICO
    perfil.restricoes_alimentares = "vegetariano"
    perfil.raio_busca_km = Decimal("3.0")
    db.add(perfil)

    for lugar in LUGARES:
        origem = f"demo:{lugar.chave}"
        estab = db.scalar(select(Estabelecimento).where(Estabelecimento.origem_externa == origem))
        if not estab:
            estab = Estabelecimento(origem_externa=origem)
            db.add(estab)
        estab.nome = lugar.nome
        estab.descricao = lugar.descricao
        estab.endereco = lugar.endereco
        estab.latitude = Decimal(str(round(CENTRO[0] + lugar.dlat, 6)))
        estab.longitude = Decimal(str(round(CENTRO[1] + lugar.dlng, 6)))
        estab.faixa_preco = lugar.preco
        estab.acessibilidade = lugar.acessivel
        estab.opcoes_alimentares = lugar.dietas
        estab.verificado = lugar.verificado
        estab.fechado_temporariamente = False
        estab.id_responsavel = contas["comerciante"].id_usuario if lugar.do_comerciante else None
        estab.categorias = [categorias[lugar.categoria]]
        estab.horarios = [
            HorarioFuncionamento(dia_semana=dia, hora_abertura=abre, hora_fechamento=fecha)
            for dia in range(7)
            for abre, fecha in lugar.horarios
        ]
        db.flush()

        db.execute(delete(Avaliacao).where(Avaliacao.id_estab == estab.id_estab))
        for autor, (nota, comentario) in zip(avaliadores, lugar.notas, strict=False):
            db.add(
                Avaliacao(
                    id_usuario=autor.id_usuario,
                    id_estab=estab.id_estab,
                    nota=nota,
                    comentario=comentario,
                )
            )
    db.commit()


def limpar(db: Session) -> None:
    emails = [e for _, e, _ in CONTAS.values()] + [e for _, e in AVALIADORES]
    usuarios = [u.id_usuario for u in db.scalars(select(Usuario).where(Usuario.email.in_(emails)))]
    lugares = list(
        db.scalars(select(Estabelecimento).where(Estabelecimento.origem_externa.like("demo:%")))
    )
    ids = [e.id_estab for e in lugares]
    for modelo in (Avaliacao, Favorito):
        db.execute(delete(modelo).where(modelo.id_usuario.in_(usuarios) | modelo.id_estab.in_(ids)))
    for estab in lugares:
        db.delete(estab)  # leva junto horários e fotos
    db.execute(delete(Perfil).where(Perfil.id_usuario.in_(usuarios)))
    db.execute(delete(Usuario).where(Usuario.id_usuario.in_(usuarios)))
    db.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--limpar", action="store_true", help="apaga os dados de demonstração")
    args = parser.parse_args()
    with SessionLocal() as db:
        if args.limpar:
            limpar(db)
            print("Dados de demonstração apagados.")
            return
        criar(db)
    print(f"{len(LUGARES)} lugares de demonstração prontos em Araraquara.")
    for _, email, tipo in CONTAS.values():
        print(f"  {tipo.value:<13} {email}  senha: {SENHA}")


if __name__ == "__main__":
    main()
