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
    # Fuso usado para saber se um estabelecimento está aberto agora (RN02).
    fuso_horario: str = "America/Sao_Paulo"
    # Velocidades médias para estimar o tempo de deslocamento (RF08).
    velocidade_a_pe_kmh: float = 4.5
    velocidade_carro_kmh: float = 25.0
    # RN08: pesos da pontuação de recomendação; precisam somar 1.
    peso_proximidade: float = 0.35
    peso_avaliacao: float = 0.25
    peso_orcamento: float = 0.20
    peso_perfil: float = 0.20

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

    # Serviços públicos do OpenStreetMap (geocodificação e importação de lugares).
    # A política de uso do Nominatim exige um User-Agent que identifique a aplicação.
    osm_user_agent: str = "TourLocal-TCC/0.1 (Fatec Araraquara)"
    nominatim_url: str = "https://nominatim.openstreetmap.org"
    overpass_url: str = "https://overpass-api.de/api/interpreter"


settings = Settings()
