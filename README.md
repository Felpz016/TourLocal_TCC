# TourLocal

Plataforma inteligente de recomendação e guia turístico personalizado em tempo real. Projeto de graduação do curso de Análise e Desenvolvimento de Sistemas da Fatec Araraquara.

O app sugere, perto da localização do turista, opções em três eixos: **Onde Comer**, **Onde Ficar** e **O que Fazer**, filtradas por orçamento, preferências e tempo disponível.

## Estrutura

| Pasta | Conteúdo |
|-------|----------|
| `api/` | API REST em FastAPI (Python), SQLAlchemy e migrações Alembic |
| `apps/mobile/` | App em React Native com Expo e Expo Router (TypeScript) |
| `docs/` | Backlog do produto e documentação técnica |

A versão web (RF20) entra na Sprint 6, consumindo a mesma API.

## Como rodar

### Tudo no PC, com simulador de celular (Windows)

Com o Docker Desktop aberto, dê dois cliques em `iniciar.cmd` na raiz do projeto (ou rode `.\iniciar.cmd` no PowerShell). Ele sobe o banco e a API, instala as dependências do app na primeira vez e abre no navegador o **simulador**: o app rodando dentro de uma moldura de iPhone, sem precisar do celular nem do Expo Go.

- Endereço: http://localhost:8081/simulador.html (dá para trocar o aparelho no topo: iPhone 17 Pro, Pro Max, SE ou Android).
- Salvou um arquivo? O app no simulador atualiza sozinho.
- O simulador mostra a versão web do app. O mapa é o do OpenStreetMap em vez do nativo, e a vibração não existe; o resto funciona igual. Para conferir esses detalhes, o QR code continua no terminal para abrir no Expo Go.
- Localização: o navegador pede permissão. Para simular outro lugar, F12 › ⋮ › More tools › Sensors › Location.

### Banco de dados e API (Docker)

```bash
docker compose up --build
```

Isso sobe o MySQL 8.4, aplica as migrações e inicia a API em http://localhost:8000. A documentação interativa fica em http://localhost:8000/docs.

Para povoar a base com lugares reais da cidade-piloto (dados do OpenStreetMap):

```bash
docker compose exec api python -m app.importacao.osm --cidade Araraquara
```

Administradores não se cadastram pelo app. Para criar o primeiro (a senha é pedida no terminal e segue a mesma regra do app: 8 caracteres ou mais, com letra maiúscula, letra minúscula e um caractere especial):

```bash
docker compose exec api python -m app.criar_admin --nome "Seu nome" --email admin@exemplo.com
```

### API sem Docker (desenvolvimento)

```bash
docker compose up -d db
cd api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
alembic upgrade head
uvicorn app.main:app --reload
```

Testes e lint: `pytest` e `ruff check . && ruff format --check .`

### App móvel

```bash
cd apps/mobile
npm install
npx expo start
```

Abra no celular com o Expo Go, com o celular e o computador na mesma rede Wi-Fi. O app usa sozinho o IP do computador onde o Expo está rodando, na porta 8000; não é preciso configurar nada. Para usar outro servidor, defina `EXPO_PUBLIC_API_URL` num arquivo `.env` (veja `.env.example`).

Se o celular não abrir `http://IP-DO-COMPUTADOR:8000/health`, libere a porta no firewall do Windows (PowerShell como administrador) e marque a rede Wi-Fi como privada:

```powershell
New-NetFirewallRule -DisplayName "TourLocal API" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
```

Se o computador tiver várias placas de rede (VirtualBox, WSL), force o IP certo no QR code com `$env:REACT_NATIVE_PACKAGER_HOSTNAME="IP-DO-WI-FI"` antes de `npx expo start`.

## Documentação da API

- [Sprint 1: autenticação e perfil (API e telas)](docs/sprint-1-api.md)
- [Sprint 2: localização, mapa e importação de lugares](docs/sprint-2-localizacao.md)
- [Sprint 3: listagem dos três eixos](docs/sprint-3-listagem.md)
- [Sprint 4: motor de recomendação e filtros](docs/sprint-4-motor.md)

## Backlog

O planejamento das sprints está em [docs/backlog.md](docs/backlog.md) e cada item é uma issue com o rótulo da sprint (`sprint-0` a `sprint-6`).
