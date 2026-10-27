import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


def enviar_email(destinatario: str, assunto: str, corpo: str) -> None:
    """Envia por SMTP. Sem SMTP configurado (desenvolvimento), apenas registra no log."""
    if not settings.smtp_host:
        logger.warning("SMTP não configurado. E-mail para %s: %s\n%s", destinatario, assunto, corpo)
        return

    mensagem = EmailMessage()
    mensagem["From"] = settings.email_remetente
    mensagem["To"] = destinatario
    mensagem["Subject"] = assunto
    mensagem.set_content(corpo)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as smtp:
        smtp.starttls()
        if settings.smtp_usuario:
            smtp.login(settings.smtp_usuario, settings.smtp_senha)
        smtp.send_message(mensagem)
