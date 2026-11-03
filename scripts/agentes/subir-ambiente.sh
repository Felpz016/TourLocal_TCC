#!/usr/bin/env bash
# Sobe a API (SQLite com dados de demonstração) e a versão web do app,
# sem Docker nem MySQL, para os agentes de melhoria navegarem e tirarem prints.
#   API: http://localhost:8000   Web: http://localhost:8081
# Uso: bash scripts/agentes/subir-ambiente.sh   (a partir da raiz do repositório)
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
TRABALHO="${AGENTE_TMP:-/tmp/tourlocal-agente}"
VENV="$TRABALHO/venv"
mkdir -p "$TRABALHO"

echo "==> Dependências da API"
[ -x "$VENV/bin/python" ] || python3 -m venv "$VENV"
"$VENV/bin/pip" install -q -r "$RAIZ/api/requirements-dev.txt"

echo "==> Banco SQLite com dados de demonstração"
export DATABASE_URL="sqlite:///$TRABALHO/tourlocal.db"
rm -f "$TRABALHO/tourlocal.db"
(cd "$RAIZ/api" && "$VENV/bin/python" -c "
import app.models  # noqa: F401
from app.db.base import Base
from app.db.session import engine
Base.metadata.create_all(engine)" && "$VENV/bin/python" -m app.demo)

echo "==> API em http://localhost:8000"
(cd "$RAIZ/api" && setsid nohup "$VENV/bin/uvicorn" app.main:app --port 8000 </dev/null >"$TRABALHO/api.log" 2>&1 &)

echo "==> Build web do app"
cd "$RAIZ/apps/mobile"
[ -d node_modules ] || npm ci --no-audit --no-fund
EXPO_PUBLIC_API_URL=http://localhost:8000 npx expo export --platform web --output-dir "$TRABALHO/web" >"$TRABALHO/export.log" 2>&1

echo "==> Web em http://localhost:8081"
(cd "$TRABALHO/web" && setsid nohup python3 -m http.server 8081 </dev/null >"$TRABALHO/web.log" 2>&1 &)

for _ in $(seq 1 30); do
  curl -sf http://localhost:8000/health >/dev/null && curl -sf http://localhost:8081 >/dev/null && break
  sleep 1
done
curl -sf http://localhost:8000/health >/dev/null || { echo "API não respondeu; veja $TRABALHO/api.log"; exit 1; }
echo "Pronto. Contas: turista|comerciante|admin @demo.tourlocal.app, senha Demo@2026"
