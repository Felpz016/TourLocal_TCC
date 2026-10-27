# Backlog do produto — TourLocal

Gerado a partir do TGI Etapa 7 (RF01–RF20, RNF01–RNF12, RN01–RN10). Sprints de duas semanas, na ordem do cronograma do documento. Cada item vira uma issue no GitHub com o rótulo da sprint.

**Stack definida:** React Native + Expo (TypeScript) · React (web) · **FastAPI (Python)** · MySQL 8 com índice composto em latitude/longitude (conforme o DER) · Leaflet/OpenStreetMap (fallback) ou Google Maps · Docker Compose · GitHub Projects.

---

## Sprint 0 — Ambiente e esqueleto (Dez./2026)

| # | Item | Critério de aceite | Ref. |
|---|------|--------------------|------|
| S0-1 | Criar repositório (monorepo `apps/mobile`, `apps/web`, `api/`, `infra/`) | README com instruções de execução | RNF09 |
| S0-2 | API FastAPI com estrutura em camadas (routers, services, repositories, models) | `GET /health` retorna 200 | RNF09 |
| S0-3 | MySQL via Docker Compose + migrações (Alembic) com as tabelas do DER | `docker compose up` sobe API + banco; migração cria todas as tabelas | RNF12 |
| S0-4 | App Expo com Expo Router e telas vazias das abas Comer / Ficar / Fazer | App abre no Expo Go | RF06 |
| S0-5 | Lint, formatação e testes (ruff + pytest; eslint + prettier) e CI no GitHub Actions | CI verde em cada PR | RNF09 |

## Sprint 1 — Cadastro, autenticação e perfil (Fev./2027)

| # | Item | Critério de aceite | Ref. |
|---|------|--------------------|------|
| S1-1 | Cadastro com perfil turista ou comerciante | Senha com hash Argon2/bcrypt; e-mail único | RF01, RNF06 |
| S1-2 | Login com JWT e recuperação de senha por e-mail | Token expira; link de redefinição de uso único | RF02 |
| S1-3 | Perfil de preferências (orçamento, restrições alimentares, acessibilidade, tempo, raio) | Raio limitado a 20 km; padrão de 3 km | RF03, RN03, RN09 |
| S1-4 | Telas de login, cadastro e preferências no app | Fluxo completo no celular | RF01–RF03 |

## Sprint 2 — Localização e mapa (Fev./2027)

| # | Item | Critério de aceite | Ref. |
|---|------|--------------------|------|
| S2-1 | Capturar GPS com `expo-location` mediante consentimento | Coordenadas não são gravadas no banco | RF04, RNF07, RN10 |
| S2-2 | Endereço manual quando o GPS é negado (geocodificação) | Busca continua com o endereço informado | RF05 |
| S2-3 | Mapa com a posição do usuário | Sem a API de mapas, a lista aparece sem o mapa | RNF08 |
| S2-4 | Povoar a base com dados iniciais (importação de API pública + seed da cidade-piloto) | Pelo menos 50 locais nos três eixos | RF19, R02 |

## Sprint 3 — Listagem dos três eixos (Mar./2027)

| # | Item | Critério de aceite | Ref. |
|---|------|--------------------|------|
| S3-1 | `GET /recomendacoes?eixo=&lat=&lng=` com filtro espacial (bounding box + Haversine) | Responde em menos de 3 s; usa índice espacial | RF06, RNF01, RNF02, R04 |
| S3-2 | Exibir distância e tempo estimado de deslocamento | Valores em cada card | RF08 |
| S3-3 | Mostrar só estabelecimentos verificados e abertos | Fechados aparecem apenas com o filtro explícito | RN01, RN02 |

## Sprint 4 — Motor de recomendação e filtros (Abr./2027)

| # | Item | Critério de aceite | Ref. |
|---|------|--------------------|------|
| S4-1 | Pontuação ponderada (proximidade, nota, orçamento, perfil) com pesos que somam 1 | Testes unitários cobrem o cálculo | RF07, RN08 |
| S4-2 | Filtros por categoria, preço, nota mínima e "aberto agora" | Reprocessa a partir da fase 2 | RF09 |
| S4-3 | Explicar por que o local foi recomendado | Card mostra os critérios principais | RF11 |
| S4-4 | Mensagem e sugestão de ampliar o raio quando não há resultados | Exceção E1 do UC04 | UC04 |

## Sprint 5 — Detalhes, rotas, avaliações e favoritos (Abr./2027)

| # | Item | Critério de aceite | Ref. |
|---|------|--------------------|------|
| S5-1 | Tela de detalhes (fotos, descrição, contato, horários, avaliações) | Rota alcançável em até 3 toques desde a tela inicial | RF10, RNF03 |
| S5-2 | Traçar rota (abrir no app de mapas ou desenhar no mapa) | Funciona em Android e iOS | RF12 |
| S5-3 | Avaliação de 1 a 5 com comentário | Uma por usuário, editável; média recalculada | RF13, RN04, RN05 |
| S5-4 | Favoritos | Salvar, remover e listar | RF14 |

## Sprint 6 — Painel do comerciante e moderação (Maio/2027)

| # | Item | Critério de aceite | Ref. |
|---|------|--------------------|------|
| S6-1 | Cadastro de estabelecimento com categoria e coordenadas | Fica pendente até a verificação | RF15, RN01 |
| S6-2 | Atualizar dados, horários e fechamento temporário | Só o dono ou o admin edita | RF16, RN07 |
| S6-3 | Upload de imagens | Limite de tamanho e formato | RF17 |
| S6-4 | Moderação de avaliações denunciadas e verificação de cadastros | Denunciadas ficam ocultas até a decisão | RF18, RN06 |
| S6-5 | Versão web responsiva consumindo a mesma API | Funciona entre 320 e 1920 px | RF20, RNF05 |

## Junho/2027 — Testes

- Testes funcionais (caixa-preta) de todos os RFs essenciais.
- Teste de usabilidade com 5 a 10 participantes, com tempo, taxa de conclusão, erros e SUS (meta ≥ 68). Ref.: RNF03, seção 2.5.
- Verificação de acessibilidade (contraste, rótulos para leitor de tela). Ref.: RNF11.
