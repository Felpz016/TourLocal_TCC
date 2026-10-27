from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.core.deps import UsuarioAtual
from app.schemas.localizacao import CoordenadasOut
from app.services import geocodificacao

router = APIRouter(prefix="/localizacao", tags=["localização"])


@router.get("/geocodificar", response_model=CoordenadasOut)
def geocodificar(
    _: UsuarioAtual,
    endereco: Annotated[str, Query(min_length=3, max_length=200)],
):
    """Endereço de referência quando o GPS está indisponível ou foi negado (RF05).

    As coordenadas são devolvidas ao app e não são gravadas (RN10).
    """
    try:
        resultado = geocodificacao.geocodificar(endereco)
    except geocodificacao.ServicoIndisponivel:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, "Serviço de endereços indisponível"
        ) from None
    if resultado is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Endereço não encontrado")
    return CoordenadasOut(**resultado.__dict__)
