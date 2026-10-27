from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configurações lidas de variáveis de ambiente (ou do arquivo .env)."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "TourLocal API"
    database_url: str = "mysql+pymysql://tourlocal:tourlocal@localhost:3306/tourlocal"
    # RN09: raio padrão quando o turista não declarou preferências.
    raio_busca_padrao_km: float = 3.0
    # RN03: raio máximo permitido no perfil.
    raio_busca_maximo_km: float = 20.0


settings = Settings()
