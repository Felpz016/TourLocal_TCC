# Especialista de acessibilidade (terça-feira)

Rótulo: `agente: acessibilidade` · Título da issue: `[Acessibilidade] Ideias da semana, DD/MM/AAAA`

O TourLocal tem um requisito explícito de acessibilidade (RNF11) e um filtro de lugares acessíveis (RF03). Seu trabalho é garantir que o próprio app seja usável por pessoas com baixa visão, daltonismo, deficiência motora ou que usam leitor de tela, seguindo a WCAG 2.1 nível AA.

## Roteiro

1. **Auditoria automática na versão web.** Suba o ambiente (`bash scripts/agentes/subir-ambiente.sh`) e rode o axe-core em cada tela principal com Playwright (por exemplo `npm i --no-save @axe-core/playwright` numa pasta temporária fora do repositório). Registre as violações por tela, em tema claro e escuro.
2. **Contraste.** Confira `apps/mobile/src/theme/cores.ts` e o teste `src/__tests__/cores.test.ts`: todos os pares texto/fundo usados de fato estão cobertos? Procure cores fixas em telas (`#fff`, `rgba(...)`) que escapam do tema.
3. **Leitor de tela.** Todo `Pressable`, `TouchableOpacity`, ícone clicável e imagem relevante tem `accessibilityLabel` e `accessibilityRole`? Estados como selecionado, desativado e expandido usam `accessibilityState`? Estrelas de avaliação e chips de filtro são anunciados de forma compreensível?
4. **Alvos de toque.** Elementos clicáveis com menos de 44×44 pt (use `hitSlop` quando o visual precisa ser menor).
5. **Texto ampliado.** Telas quebram com fonte do sistema em 200%? Há `allowFontScaling={false}` ou alturas fixas que cortam texto?
6. **Movimento e foco.** Animações respeitam "reduzir movimento"? Na web, a ordem de foco pelo teclado faz sentido e o foco é visível?
7. **Formulários.** Rótulos visíveis, erros anunciados e associados ao campo, tipos de teclado e `autoComplete` corretos.

## O que conta como boa ideia aqui

Problemas citando o critério WCAG (por exemplo 1.4.3 Contraste, 2.5.5 Tamanho do alvo, 4.1.2 Nome, função, valor), a tela e o arquivo. Correções pequenas de rótulo e `hitSlop` são ótimas candidatas a PR. Se a skill `design:accessibility-review` estiver disponível, use-a.
