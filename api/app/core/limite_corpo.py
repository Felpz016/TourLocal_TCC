"""Limite de tamanho do corpo das requisições (OWASP API4: consumo de recursos sem limite).

O FastAPI lê o corpo inteiro (JSON ou formulário com arquivo) antes de conferir quem está
chamando: um pedido de 1 GB sem login seria lido e gravado em arquivo temporário só para
depois responder 401. Este middleware recusa o excesso na entrada, antes de qualquer
leitura, com 413 Payload Too Large.

Dois limites:
- envio de foto (RF17): o tamanho máximo da foto mais uma folga para o formulário;
- todo o resto: JSON pequeno (o maior, cadastro de local com 21 horários, tem poucos KB).
"""

import json
import re

from fastapi import HTTPException, status

from app.core.config import settings

ROTA_DE_FOTO = re.compile(r"^/estabelecimentos/\d+/fotos/?$")
# Legenda, nomes dos campos e separadores do formulário multipart.
FOLGA_DO_FORMULARIO = 64 * 1024

MENSAGEM = "Requisição grande demais"


def limite_para(metodo: str, caminho: str) -> int:
    if metodo == "POST" and ROTA_DE_FOTO.match(caminho):
        return settings.foto_tamanho_maximo_mb * 1024 * 1024 + FOLGA_DO_FORMULARIO
    return settings.corpo_maximo_kb * 1024


def _grande_demais() -> HTTPException:
    return HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, MENSAGEM)


class LimiteDoCorpo:
    """Middleware ASGI: confere o Content-Length e conta os bytes que de fato chegam."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        limite = limite_para(scope["method"], scope["path"])

        # Caso comum: o tamanho vem declarado e já dá para recusar sem ler nada.
        for nome, valor in scope["headers"]:
            if nome == b"content-length":
                try:
                    declarado = int(valor)
                except ValueError:
                    declarado = 0
                if declarado > limite:
                    await _responder_413(send)
                    return
                break

        # Sem Content-Length (envio em partes) ou declarando menos do que manda: conta o
        # que chega e interrompe a leitura assim que passar do limite.
        recebidos = 0

        async def receber_contando():
            nonlocal recebidos
            mensagem = await receive()
            if mensagem["type"] == "http.request":
                recebidos += len(mensagem.get("body", b""))
                if recebidos > limite:
                    # A rota trata HTTPException durante a leitura do corpo como resposta.
                    raise _grande_demais()
            return mensagem

        resposta_comecou = False

        async def enviar(mensagem):
            nonlocal resposta_comecou
            if mensagem["type"] == "http.response.start":
                resposta_comecou = True
            await send(mensagem)

        try:
            await self.app(scope, receber_contando, enviar)
        except HTTPException as erro:
            # Leitura interrompida fora de uma rota (por exemplo, num middleware).
            if erro.status_code != status.HTTP_413_CONTENT_TOO_LARGE or resposta_comecou:
                raise
            await _responder_413(send)


async def _responder_413(send) -> None:
    corpo = json.dumps({"detail": MENSAGEM}, ensure_ascii=False).encode()
    await send(
        {
            "type": "http.response.start",
            "status": status.HTTP_413_CONTENT_TOO_LARGE,
            "headers": [
                (b"content-type", b"application/json; charset=utf-8"),
                (b"content-length", str(len(corpo)).encode()),
                (b"connection", b"close"),
            ],
        }
    )
    await send({"type": "http.response.body", "body": corpo})
