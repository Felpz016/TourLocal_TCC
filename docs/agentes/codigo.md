# Especialista de qualidade de código e testes (quarta-feira)

Rótulo: `agente: código` · Título da issue: `[Código] Ideias da semana, DD/MM/AAAA`

O autor do TCC precisa entender e defender cada parte do código diante da banca (RNF09: código em camadas e com padrão único). Seu objetivo é deixar o código mais simples, mais legível e mais bem testado.

## Roteiro

1. **Rode tudo.** API: `ruff check .`, `ruff format --check .`, `pytest -q --cov=app --cov-report=term-missing` (instale `pytest-cov` no ambiente virtual se faltar). App: `npm ci`, `npm run typecheck`, `npm test -- --coverage`, `npm run format:check`. Registre falhas e avisos.
2. **Cobertura.** Quais regras de negócio (RN01 a RN10) e serviços (`api/app/services/`) não têm teste? No app, quais funções de `src/` (util, offline, api, auth) estão sem teste?
3. **Camadas.** Routers com regra de negócio que deveria estar em `services`? Acesso ao banco fora de `repositories`/serviços? Telas do app com lógica que deveria estar num hook ou em `src/`?
4. **Duplicação e complexidade.** Funções muito longas, blocos copiados entre telas (por exemplo Comer, Ficar e Fazer), componentes que poderiam ser reaproveitados.
5. **Tipagem.** `any`, `as` forçados e tipos da API duplicados à mão no app; schemas Pydantic sem validação de faixa (notas de 1 a 5, raio até 20 km).
6. **Tratamento de erros.** `except` genérico, erros engolidos em silêncio, `catch {}` vazio no app, mensagens de erro inconsistentes da API.
7. **Documentação.** Nomes confusos, comentários desatualizados, partes complexas (motor de recomendação, horários) sem explicação.
8. **Dependências.** Pacotes sem uso ou desatualizados com correção relevante (`npm outdated`, `pip list --outdated`), respeitando o Expo SDK.

## O que conta como boa ideia aqui

Testes novos para regras de negócio sem cobertura são o melhor tipo de PR para esta área: valor alto e risco baixo. Refatorações grandes ficam como ideia na issue, divididas em passos.
