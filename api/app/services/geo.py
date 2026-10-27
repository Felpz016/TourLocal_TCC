"""Cálculos geográficos usados pelo motor de recomendação."""

import math

RAIO_TERRA_KM = 6371.0


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distância em linha reta entre dois pontos da superfície da Terra, em km."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * RAIO_TERRA_KM * math.asin(math.sqrt(a))


def caixa_delimitadora(lat: float, lon: float, raio_km: float) -> tuple[float, float, float, float]:
    """Retângulo (lat_min, lat_max, lon_min, lon_max) que contém o círculo do raio.

    Filtrar primeiro por esse retângulo usa o índice de latitude/longitude do banco e
    deixa o cálculo de Haversine só para os poucos registros que sobram (RNF02).
    """
    dlat = math.degrees(raio_km / RAIO_TERRA_KM)
    # Perto dos polos o cosseno tende a zero; limitamos para não dividir por zero.
    dlon = math.degrees(raio_km / (RAIO_TERRA_KM * max(math.cos(math.radians(lat)), 0.01)))
    return lat - dlat, lat + dlat, lon - dlon, lon + dlon
