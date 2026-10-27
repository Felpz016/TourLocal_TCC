# Sprint 1: API de autenticação e perfil

Este guia explica o que a API da Sprint 1 faz e como as telas do app (issue #9) devem usá-la.
Com a API rodando, a documentação interativa em http://localhost:8000/docs permite testar cada rota.

## Rotas

| Método e rota | Para que serve | Corpo (JSON) | Respostas |
|---|---|---|---|
| `POST /auth/cadastro` | Criar conta (RF01) | `nome`, `email`, `senha` (mín. 8), `tipo` (`turista` ou `comerciante`) | 201 com o usuário · 409 e-mail já existe · 422 dados inválidos |
| `POST /auth/login` | Entrar (RF02) | `email`, `senha` | 200 com `access_token` · 401 credenciais erradas |
| `GET /auth/me` | Dados do usuário logado | (nenhum) | 200 · 401 sem token |
| `POST /auth/recuperar-senha` | Pedir link de nova senha (RF02) | `email` | 202 sempre, exista ou não o e-mail |
| `POST /auth/redefinir-senha` | Gravar a nova senha | `token`, `nova_senha` | 204 · 400 link inválido, expirado ou já usado |
| `GET /perfil` | Ler preferências (RF03) | (nenhum) | 200 · 403 se não for turista |
| `PUT /perfil` | Salvar preferências (RF03) | ver abaixo | 200 · 422 dados inválidos |

Rotas que exigem login recebem o cabeçalho `Authorization: Bearer <access_token>`.

### Corpo do `PUT /perfil`

```json
{
  "faixa_orcamento": "economico",
  "restricoes_alimentares": ["vegetariano", "sem_gluten"],
  "necessita_acessibilidade": true,
  "tempo_disponivel_min": 120,
  "raio_busca_km": "5"
}
```

- `faixa_orcamento`: `economico`, `moderado`, `alto` ou `null`.
- `tempo_disponivel_min`: de 15 a 1440, ou `null`.
- `raio_busca_km`: maior que 0 e no máximo 20 (RN03). Sem perfil salvo, o `GET` devolve 3 km (RN09).

## Como funciona por dentro

- **Senhas (RNF06):** nunca são gravadas. O banco guarda só um hash Argon2 com sal aleatório (`app/core/security.py`).
- **Token de acesso:** um JWT assinado com `SECRET_KEY`, que guarda o id do usuário e vale 24 horas. A API não guarda sessão; ela confere a assinatura a cada requisição (`app/core/deps.py`).
- **Recuperação de senha:** o link leva um JWT que vale 30 minutos e carrega um pedaço do hash da senha atual. Quando a senha muda, esse pedaço deixa de bater, então o link só funciona uma vez, sem precisar de tabela extra.
- **E-mail:** sem `SMTP_HOST` configurado, o link aparece no log da API (`docker compose logs api`), o que basta para testar.
- **Camadas:** a rota (`routers/`) só traduz HTTP; a regra fica no serviço (`services/`); o acesso ao banco fica no repositório (`repositories/`).
- **Mudança no DER:** o RF03 pede acessibilidade no perfil, mas a tabela PERFIL do DER não tinha esse campo. Foi criada a coluna `necessita_acessibilidade` (migração `0002`). Vale atualizar a Figura 3 do TGI.

## Dicas para as telas (issue #9)

- Guarde o `access_token` com `expo-secure-store`, não em `AsyncStorage`, porque ele dá acesso à conta.
- Centralize as chamadas em `src/api/client.ts`, que já tem o `API_URL`, e crie uma função que acrescente o cabeçalho `Authorization`.
- Ao receber 401 em qualquer rota, apague o token e mande o usuário para o login.
- Mostre os erros 409 e 401 com mensagens amigáveis ("Este e-mail já tem conta", "E-mail ou senha incorretos").
- O link de recuperação usa o esquema `tourlocal://redefinir-senha?token=...`. Com o Expo Router, uma tela `app/redefinir-senha.tsx` recebe o token por `useLocalSearchParams()`.
- Instale pacotes com as versões do SDK 58: confira em `node_modules/expo/bundledNativeModules.json`.
