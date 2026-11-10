"""A API rodando dentro do navegador, para a demonstração pública na web (GitHub Pages).

A versão publicada do app não tem servidor: o Pyodide (Python compilado para WebAssembly)
carrega este mesmo código da API no navegador de quem abre o link, com um banco SQLite em
memória preenchido pelos dados de demonstração (app.demo). O app chama `responder` no
lugar do fetch, e cada pedido passa pelas mesmas rotas, regras e validações da API real.

Só é usado pela demonstração web; a API de verdade continua rodando com uvicorn e MySQL.
"""

import json
import os

# Antes de importar a API: banco e fotos ficam no sistema de arquivos virtual do navegador.
os.environ.setdefault("DATABASE_URL", "sqlite:////tmp/tourlocal.db")
os.environ.setdefault("PASTA_UPLOADS", "/tmp/uploads")

import anyio.to_thread  # noqa: E402


async def _sem_threads(funcao, *args, **_opcoes):
    # O navegador não tem threads: as rotas síncronas rodam direto, uma de cada vez.
    return funcao(*args)


anyio.to_thread.run_sync = _sem_threads

from app.db.base import Base  # noqa: E402
from app.db.session import SessionLocal, engine  # noqa: E402
from app.services import geocodificacao  # noqa: E402


def _geocodificar_pelo_navegador(endereco: str, client=None):
    """Nominatim chamado pelo próprio navegador (o httpx não abre conexões no Pyodide)."""
    from urllib.parse import urlencode

    from pyodide.http import open_url

    parametros = urlencode({"q": endereco, "format": "jsonv2", "limit": 1, "countrycodes": "br"})
    try:
        resultados = json.loads(
            open_url(f"{geocodificacao.settings.nominatim_url}/search?{parametros}").read()
        )
    except Exception as erro:
        raise geocodificacao.ServicoIndisponivel() from erro
    if not resultados:
        return None
    primeiro = resultados[0]
    return geocodificacao.Coordenadas(
        latitude=float(primeiro["lat"]),
        longitude=float(primeiro["lon"]),
        endereco=primeiro.get("display_name", endereco),
    )


geocodificacao.geocodificar = _geocodificar_pelo_navegador

import app.models  # noqa: E402, F401
from app import demo  # noqa: E402
from app.main import app  # noqa: E402

Base.metadata.create_all(engine)
# Todas as contas de demonstração têm a mesma senha. O Argon2 é lento de propósito (RNF06),
# e no navegador ainda mais: calcula o hash uma vez só e reaproveita para as seis contas.
_hash_da_senha_demo = demo.gerar_hash_senha(demo.SENHA)
demo.gerar_hash_senha = lambda _senha: _hash_da_senha_demo
with SessionLocal() as _db:
    demo.criar(_db)


async def responder(metodo: str, caminho: str, cabecalhos_json: str, corpo: bytes | None):
    """Executa um pedido HTTP na API e devolve (status, cabeçalhos em JSON, corpo)."""
    caminho_puro, _, query = caminho.partition("?")
    cabecalhos = [
        (nome.lower().encode("latin-1"), valor.encode("latin-1"))
        for nome, valor in json.loads(cabecalhos_json).items()
    ]
    escopo = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": metodo.upper(),
        "scheme": "https",
        "path": caminho_puro,
        "raw_path": caminho_puro.encode(),
        "query_string": query.encode(),
        "root_path": "",
        "headers": cabecalhos,
        "client": ("127.0.0.1", 0),
        "server": ("demo.tourlocal", 443),
    }
    pendente = [{"type": "http.request", "body": bytes(corpo or b""), "more_body": False}]
    resposta: dict = {"status": 500, "cabecalhos": {}, "corpo": bytearray()}

    async def receber():
        if pendente:
            return pendente.pop()
        return {"type": "http.disconnect"}

    async def enviar(mensagem):
        if mensagem["type"] == "http.response.start":
            resposta["status"] = mensagem["status"]
            resposta["cabecalhos"] = {
                nome.decode("latin-1"): valor.decode("latin-1")
                for nome, valor in mensagem.get("headers", [])
            }
        elif mensagem["type"] == "http.response.body":
            resposta["corpo"] += mensagem.get("body", b"")

    await app(escopo, receber, enviar)
    return resposta["status"], json.dumps(resposta["cabecalhos"]), bytes(resposta["corpo"])
