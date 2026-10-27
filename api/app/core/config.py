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

    # Autenticação (RF02). Em produção, defina SECRET_KEY com um valor longo e aleatório.
    secret_key: str = "chave-de-desenvolvimento-troque-em-producao"
    access_token_expira_min: int = 60 * 24
    reset_token_expira_min: int = 30
    # Link enviado no e-mail de recuperação; o token é anexado como ?token=...
    reset_url: str = "tourlocal://redefinir-senha"

    # Envio de e-mail. Sem SMTP_HOST, o link de recuperação só é registrado no log.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_usuario: str = ""
    smtp_senha: str = ""
    email_remetente: str = "nao-responda@tourlocal.app"


settings = Settings()
