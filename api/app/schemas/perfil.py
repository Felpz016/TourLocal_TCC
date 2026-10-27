from decimal import Decimal

from pydantic import BaseModel, Field

from app.core.config import settings
from app.models.enums import FaixaPreco


class PerfilIn(BaseModel):
    faixa_orcamento: FaixaPreco | None = None
    restricoes_alimentares: list[str] = Field(default_factory=list, max_length=10)
    necessita_acessibilidade: bool = False
    tempo_disponivel_min: int | None = Field(default=None, ge=15, le=24 * 60)
    # RN03: limitado a 20 km. RN09: 3 km quando não informado.
    raio_busca_km: Decimal = Field(
        default=Decimal(str(settings.raio_busca_padrao_km)),
        gt=0,
        le=Decimal(str(settings.raio_busca_maximo_km)),
        decimal_places=1,
    )


class PerfilOut(PerfilIn):
    pass
