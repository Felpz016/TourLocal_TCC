"""Converte um endereço digitado em coordenadas (RF05), usando o Nominatim do OpenStreetMap."""

from dataclasses import dataclass

import httpx

from app.core.config import settings


class ServicoIndisponivel(Exception):
    pass


@dataclass
class Coordenadas:
    latitude: float
    longitude: float
    endereco: str


def geocodificar(endereco: str, client: httpx.Client | None = None) -> Coordenadas | None:
    """Devolve as coordenadas do endereço, ou None se nada for encontrado."""
    parametros = {"q": endereco, "format": "jsonv2", "limit": 1, "countrycodes": "br"}
    headers = {"User-Agent": settings.osm_user_agent, "Accept-Language": "pt-BR"}
    http = client or httpx.Client(timeout=10)
    try:
        resposta = http.get(f"{settings.nominatim_url}/search", params=parametros, headers=headers)
        resposta.raise_for_status()
    except httpx.HTTPError as erro:
        raise ServicoIndisponivel() from erro
    finally:
        if client is None:
            http.close()

    resultados = resposta.json()
    if not resultados:
        return None
    primeiro = resultados[0]
    return Coordenadas(
        latitude=float(primeiro["lat"]),
        longitude=float(primeiro["lon"]),
        endereco=primeiro.get("display_name", endereco),
    )
