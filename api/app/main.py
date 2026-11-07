from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.privacidade import proteger_log_de_acesso
from app.routers import (
    admin,
    auth,
    estabelecimentos,
    gestao,
    health,
    localizacao,
    perfil,
    recomendacoes,
)
from app.services import fotos

# RN10/RNF07: a posição do turista vai na URL das consultas; o log de acesso não a guarda.
proteger_log_de_acesso()

# A documentação interativa (/docs) ajuda no desenvolvimento, mas numa API publicada só
# mostraria o mapa de rotas para quem quiser atacá-la.
_docs = settings.em_desenvolvimento
app = FastAPI(
    title=settings.app_name,
    docs_url="/docs" if _docs else None,
    redoc_url="/redoc" if _docs else None,
    openapi_url="/openapi.json" if _docs else None,
)

# No desenvolvimento libera qualquer origem; publicada, só as de CORS_ORIGENS.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origens,
    allow_methods=["*"],
    allow_headers=["*"],
)

CABECALHOS_DE_SEGURANCA = {
    # O navegador não tenta "adivinhar" o tipo do arquivo: uma foto em /uploads nunca é
    # tratada como página ou script.
    "X-Content-Type-Options": "nosniff",
    # A API não é página para ficar dentro de outro site.
    "X-Frame-Options": "DENY",
    # Links para fora não levam o endereço da API (nem tokens na URL).
    "Referrer-Policy": "no-referrer",
}


@app.middleware("http")
async def cabecalhos_de_seguranca(request: Request, chamar_proxima):
    resposta = await chamar_proxima(request)
    for nome, valor in CABECALHOS_DE_SEGURANCA.items():
        resposta.headers.setdefault(nome, valor)
    return resposta


app.include_router(health.router)
app.include_router(auth.router)
app.include_router(perfil.router)
app.include_router(localizacao.router)
app.include_router(recomendacoes.router)
app.include_router(estabelecimentos.router)
app.include_router(gestao.router)
app.include_router(admin.router)

# Fotos enviadas pelos comerciantes (RF17).
app.mount("/uploads", StaticFiles(directory=fotos.pasta()), name="uploads")
