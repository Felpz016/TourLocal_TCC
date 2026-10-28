# Sprint 1: autenticação e perfil

Este guia explica a API e as telas da Sprint 1.
Com a API rodando, a documentação interativa em http://localhost:8000/docs permite testar cada rota.

## Rotas

| Método e rota | Para que serve | Corpo (JSON) | Respostas |
|---|---|---|---|
| `POST /auth/cadastro` | Criar conta (RF01) | `nome`, `email`, `senha` (forte, ver abaixo), `tipo` (`turista` ou `comerciante`) | 201 com o usuário · 409 e-mail já existe · 422 dados inválidos |
| `POST /auth/login` | Entrar (RF02) | `email`, `senha` | 200 com `access_token` · 401 credenciais erradas |
| `GET /auth/me` | Dados do usuário logado | (nenhum) | 200 · 401 sem token |
| `POST /auth/recuperar-senha` | Pedir link de nova senha (RF02) | `email` | 202 sempre, exista ou não o e-mail |
| `POST /auth/redefinir-senha` | Gravar a nova senha | `token`, `nova_senha` (forte) | 204 · 400 link inválido, expirado ou já usado |
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
- **Senha forte:** no cadastro e na troca de senha, a API exige 8 caracteres ou mais, com letra maiúscula, letra minúscula e um caractere especial (`app/core/senha.py`). Se faltar algo, responde 422 dizendo o que falta, e o app mostra a mesma lista de requisitos enquanto a pessoa digita (`src/util/senha.ts`). Contas antigas continuam entrando com a senha que já têm.
- **Recuperação de senha:** o link leva um JWT que vale 30 minutos e carrega um pedaço do hash da senha atual. Quando a senha muda, esse pedaço deixa de bater, então o link só funciona uma vez, sem precisar de tabela extra.
- **E-mail:** sem `SMTP_HOST` configurado, o link aparece no log da API (`docker compose logs api`), o que basta para testar.
- **Camadas:** a rota (`routers/`) só traduz HTTP; a regra fica no serviço (`services/`); o acesso ao banco fica no repositório (`repositories/`).
- **Mudança no DER:** o RF03 pede acessibilidade no perfil, mas a tabela PERFIL do DER não tinha esse campo. Foi criada a coluna `necessita_acessibilidade` (migração `0002`). Vale atualizar a Figura 3 do TGI.

## Telas do app (issue #9)

| Tela | Arquivo | O que faz |
|---|---|---|
| Login | `app/(auth)/login.tsx` | Entra com e-mail e senha; mostra "E-mail ou senha incorretos" no 401 |
| Cadastro | `app/(auth)/cadastro.tsx` | Turista ou dono de estabelecimento; valida os campos antes de enviar e entra direto depois de criar a conta |
| Esqueci a senha | `app/(auth)/recuperar-senha.tsx` | Pede o link por e-mail |
| Nova senha | `app/redefinir-senha.tsx` | Aberta pelo link `tourlocal://redefinir-senha?token=...` |
| Preferências | `app/preferencias.tsx` | Orçamento, restrições, tempo, distância e acessibilidade; aparece sozinha logo após o cadastro do turista |

Como as peças se conectam:

- **`src/api/client.ts`** faz todas as chamadas, acrescenta o cabeçalho `Authorization` e transforma os erros da API em mensagens prontas para exibir. Se a API responder 401 com alguém logado, a sessão é encerrada.
- **`src/auth/AuthContext.tsx`** guarda quem está logado e oferece `entrar` e `sair` para qualquer tela (`useAuth()`). Ao abrir o app, ele recupera a sessão salva.
- **`src/auth/armazenamento.ts`** guarda o token com `expo-secure-store` (Keychain no iOS, Keystore no Android). Na web, usa o `localStorage`.
- **`app/_layout.tsx`** usa `Stack.Protected`: sem login, só as telas de `(auth)` existem; com login, só as abas e as preferências. Por isso nenhuma tela precisa checar o login por conta própria.
- **`src/components/ui/`** tem os componentes reaproveitados (campo, botão, opção, aviso, moldura da tela), com rótulos para leitor de tela e áreas de toque de pelo menos 44 px (RNF11).

Para testar no navegador: `npx expo start --web`. Para o link de recuperação abrir a versão web em vez do app, defina `RESET_URL=http://localhost:8081/redefinir-senha` na API.
