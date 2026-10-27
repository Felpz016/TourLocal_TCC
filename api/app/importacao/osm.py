"""Importa estabelecimentos do OpenStreetMap para povoar a base (RF19).

Uso, com a API configurada para o banco:

    python -m app.importacao.osm --cidade Araraquara

Ou dentro do Docker:

    docker compose exec api python -m app.importacao.osm --cidade Araraquara

A importação pode ser repetida: cada lugar é identificado pelo seu id no OpenStreetMap
(campo origem_externa), então os registros são atualizados em vez de duplicados.
"""

import argparse
from dataclasses import dataclass, field
from datetime import time
from decimal import Decimal

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal
from app.importacao.horarios import interpretar
from app.models import Estabelecimento, HorarioFuncionamento
from app.services.categorias import garantir_categorias

# (chave OSM, valor OSM) -> nome da categoria em app/services/categorias.py
MAPA_CATEGORIAS: dict[tuple[str, str], str] = {
    ("amenity", "restaurant"): "Restaurante",
    ("amenity", "food_court"): "Restaurante",
    ("amenity", "fast_food"): "Lanchonete",
    ("amenity", "cafe"): "Cafeteria",
    ("amenity", "bar"): "Bar",
    ("amenity", "pub"): "Bar",
    ("amenity", "ice_cream"): "Sorveteria",
    ("amenity", "theatre"): "Teatro",
    ("amenity", "cinema"): "Cinema",
    ("amenity", "arts_centre"): "Centro cultural",
    ("tourism", "hotel"): "Hotel",
    ("tourism", "guest_house"): "Pousada",
    ("tourism", "hostel"): "Hostel",
    ("tourism", "motel"): "Motel",
    ("tourism", "museum"): "Museu",
    ("tourism", "attraction"): "Ponto turístico",
    ("tourism", "viewpoint"): "Mirante",
    ("tourism", "gallery"): "Galeria",
    ("tourism", "zoo"): "Zoológico",
    ("leisure", "park"): "Parque",
}


def montar_consulta(cidade: str) -> str:
    filtros = []
    for chave in ("amenity", "tourism", "leisure"):
        valores = "|".join(v for (k, v) in MAPA_CATEGORIAS if k == chave)
        filtros.append(f'nwr["{chave}"~"^({valores})$"]["name"](area.cidade);')
    return (
        "[out:json][timeout:90];"
        f'area["name"="{cidade}"]["boundary"="administrative"]["admin_level"="8"]->.cidade;'
        f"({''.join(filtros)});"
        "out center tags;"
    )


@dataclass
class LugarOsm:
    origem_externa: str
    nome: str
    categoria: str
    latitude: Decimal
    longitude: Decimal
    endereco: str
    descricao: str | None
    acessibilidade: bool
    opcoes_alimentares: str | None = None
    horarios: list[tuple[int, time, time]] | None = field(default=None)


def _endereco(tags: dict[str, str], cidade: str) -> str:
    rua = tags.get("addr:street")
    numero = tags.get("addr:housenumber")
    bairro = tags.get("addr:suburb")
    partes = [f"{rua}, {numero}" if rua and numero else rua, bairro, cidade]
    return " - ".join(p for p in partes if p)


# Tags "diet:*" do OSM -> valores usados no perfil do turista.
DIETAS = {
    "diet:vegetarian": "vegetariano",
    "diet:vegan": "vegano",
    "diet:gluten_free": "sem_gluten",
    "diet:lactose_free": "sem_lactose",
}


def _opcoes_alimentares(tags: dict[str, str]) -> str | None:
    opcoes = [valor for tag, valor in DIETAS.items() if tags.get(tag) in ("yes", "only")]
    return ",".join(opcoes) or None


def converter(elemento: dict, cidade: str) -> LugarOsm | None:
    """Converte um elemento da resposta do Overpass, ou None se não servir."""
    tags = elemento.get("tags", {})
    nome = tags.get("name")
    categoria = next(
        (cat for (k, v), cat in MAPA_CATEGORIAS.items() if tags.get(k) == v),
        None,
    )
    # Vias e áreas (ways/relations) vêm com o ponto central em "center".
    ponto = elemento if "lat" in elemento else elemento.get("center")
    if not nome or not categoria or not ponto:
        return None

    descricao = tags.get("description")
    if not descricao and tags.get("cuisine"):
        descricao = "Cozinha: " + tags["cuisine"].replace(";", ", ").replace("_", " ")

    return LugarOsm(
        origem_externa=f"osm:{elemento['type']}/{elemento['id']}",
        nome=nome[:150],
        categoria=categoria,
        latitude=Decimal(str(ponto["lat"])).quantize(Decimal("0.000001")),
        longitude=Decimal(str(ponto["lon"])).quantize(Decimal("0.000001")),
        endereco=_endereco(tags, cidade)[:255],
        descricao=descricao,
        acessibilidade=tags.get("wheelchair") == "yes",
        opcoes_alimentares=_opcoes_alimentares(tags),
        horarios=interpretar(tags.get("opening_hours")),
    )


def buscar_no_overpass(cidade: str) -> list[dict]:
    resposta = httpx.post(
        settings.overpass_url,
        data={"data": montar_consulta(cidade)},
        headers={"User-Agent": settings.osm_user_agent},
        timeout=120,
    )
    resposta.raise_for_status()
    return resposta.json()["elements"]


def salvar(db: Session, lugares: list[LugarOsm], verificar: bool = True) -> tuple[int, int]:
    """Insere ou atualiza os lugares. Devolve (novos, atualizados)."""
    categorias = garantir_categorias(db)
    novos = atualizados = 0
    for lugar in lugares:
        estab = db.scalar(
            select(Estabelecimento).where(Estabelecimento.origem_externa == lugar.origem_externa)
        )
        if estab is None:
            # RN01: só aparecem estabelecimentos verificados. Dados do OSM entram já
            # verificados para a base de testes não ficar vazia (use --nao-verificar para mudar).
            estab = Estabelecimento(origem_externa=lugar.origem_externa, verificado=verificar)
            db.add(estab)
            novos += 1
        elif estab.id_responsavel is not None:
            # Um comerciante já assumiu o cadastro; os dados dele prevalecem (RN07).
            continue
        else:
            atualizados += 1

        estab.nome = lugar.nome
        estab.endereco = lugar.endereco
        estab.latitude = lugar.latitude
        estab.longitude = lugar.longitude
        estab.descricao = lugar.descricao
        estab.acessibilidade = lugar.acessibilidade
        estab.opcoes_alimentares = lugar.opcoes_alimentares
        estab.categorias = [categorias[lugar.categoria]]
        if lugar.horarios is not None:
            estab.horarios = [
                HorarioFuncionamento(dia_semana=d, hora_abertura=a, hora_fechamento=f)
                for d, a, f in lugar.horarios
            ]
    db.commit()
    return novos, atualizados


def main() -> None:
    parser = argparse.ArgumentParser(description="Importa lugares do OpenStreetMap.")
    parser.add_argument("--cidade", default="Araraquara")
    parser.add_argument(
        "--nao-verificar",
        action="store_true",
        help="importa como não verificados (precisam de aprovação do administrador)",
    )
    args = parser.parse_args()

    print(f"Consultando o OpenStreetMap para {args.cidade}...")
    elementos = buscar_no_overpass(args.cidade)
    lugares = [lugar for e in elementos if (lugar := converter(e, args.cidade))]
    with SessionLocal() as db:
        novos, atualizados = salvar(db, lugares, verificar=not args.nao_verificar)
    print(f"{len(lugares)} lugares encontrados: {novos} novos, {atualizados} atualizados.")


if __name__ == "__main__":
    main()
