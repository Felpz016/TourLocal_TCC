from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
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

app = FastAPI(title=settings.app_name)

# Libera o acesso do app Expo e da versão web durante o desenvolvimento.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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
