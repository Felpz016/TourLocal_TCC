"""Armazenamento das fotos enviadas pelos comerciantes (RF17).

As fotos ficam numa pasta local servida pela própria API em /uploads. Para produção,
a mesma interface poderia gravar num serviço de armazenamento (ex.: S3).
"""

import uuid
from pathlib import Path

from app.core.config import settings

PREFIXO_URL = "/uploads/"

# Assinatura (primeiros bytes) de cada formato aceito. Conferir o conteúdo, e não só a
# extensão ou o Content-Type, impede que outro tipo de arquivo seja enviado como imagem.
ASSINATURAS = {
    b"\xff\xd8\xff": ".jpg",
    b"\x89PNG\r\n\x1a\n": ".png",
}


class FotoInvalida(Exception):
    pass


def _extensao(conteudo: bytes) -> str | None:
    for assinatura, extensao in ASSINATURAS.items():
        if conteudo.startswith(assinatura):
            return extensao
    if conteudo[:4] == b"RIFF" and conteudo[8:12] == b"WEBP":
        return ".webp"
    return None


def pasta() -> Path:
    caminho = Path(settings.pasta_uploads)
    caminho.mkdir(parents=True, exist_ok=True)
    return caminho


def salvar(conteudo: bytes) -> str:
    """Valida tamanho e formato, grava o arquivo e devolve a URL relativa."""
    limite = settings.foto_tamanho_maximo_mb * 1024 * 1024
    if len(conteudo) > limite:
        raise FotoInvalida(f"A foto deve ter no máximo {settings.foto_tamanho_maximo_mb} MB")
    extensao = _extensao(conteudo)
    if extensao is None:
        raise FotoInvalida("Envie uma imagem JPG, PNG ou WebP")
    nome = f"{uuid.uuid4().hex}{extensao}"
    (pasta() / nome).write_bytes(conteudo)
    return PREFIXO_URL + nome


def apagar(url: str) -> None:
    """Apaga o arquivo se ele foi enviado para cá (fotos externas são só links)."""
    if url.startswith(PREFIXO_URL):
        (pasta() / Path(url).name).unlink(missing_ok=True)
