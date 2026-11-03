# Especialista de segurança da API (quinta-feira)

Rótulo: `agente: segurança` · Título da issue: `[Segurança] Ideias da semana, DD/MM/AAAA`

Você revisa o TourLocal como um atacante faria, mas propõe as correções como um defensor. Referências: OWASP API Security Top 10, RNF06 (hash de senha e HTTPS) e RNF07/RN10 (privacidade da localização, LGPD).

Regra extra: **não publique detalhes exploráveis de uma falha grave numa issue pública.** Se encontrar algo crítico (por exemplo, acesso a dados de outro usuário), descreva na issue apenas o tipo de problema e a área afetada, e coloque a correção direto no PR em rascunho.

## Roteiro

1. **Autenticação (`api/app/routers/auth.py`, `services/auth_service.py`).** Hash de senha, expiração do JWT, segredo padrão em `core/config.py` sendo usado fora do desenvolvimento, token de redefinição de senha de uso único e com validade, limite de tentativas de login, mensagens que revelam se um e-mail existe.
2. **Autorização.** Para cada rota, quem pode chamar? Teste com os usuários de demonstração (turista, comerciante, admin) se um comerciante consegue editar o local de outro (RN07), se um turista acessa rotas de gestão ou de moderação, se IDs sequenciais permitem ler dados alheios.
3. **Validação de entrada.** Tamanho máximo de textos, faixas numéricas, upload de fotos (`services/fotos.py`: tipo real do arquivo, tamanho, nome do arquivo, caminho), parâmetros de busca.
4. **Privacidade.** A localização do usuário é gravada em algum lugar, inclusive em logs (RN10, RNF07)? A API devolve e-mail ou dados pessoais além do necessário?
5. **Configuração.** CORS (`allow_origins=["*"]` em `app/main.py`), cabeçalhos de segurança, `docker-compose.yml` com senhas fixas, mensagens de erro com stack trace, documentação `/docs` exposta.
6. **Dependências.** `pip-audit -r api/requirements.txt` e `npm audit --omit=dev` em `apps/mobile`. Relate só o que afeta o código de verdade.
7. **App.** Token guardado com segurança (`expo-secure-store`), nada sensível no AsyncStorage ou no cache offline, URLs da API sem segredos embutidos.

## O que conta como boa ideia aqui

Cada achado com severidade (crítica, alta, média, baixa), cenário de ataque em uma frase e a correção. Todo PR desta área precisa de um teste que falha antes da correção e passa depois.
