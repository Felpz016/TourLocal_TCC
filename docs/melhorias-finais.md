# Melhorias depois do backlog

Sete melhorias feitas depois das seis sprints, pensando na apresentação e no uso real na rua. Para cada uma: o que faz, onde está o código e como explicar para a banca.

## 1. Busca por nome

A barra no topo de cada eixo procura no **nome, na categoria e no endereço** dos lugares. "cafe" acha "Café da Praça" e "acai" acha "Açaí": o texto é comparado sem acentos e sem maiúsculas.

- API: `GET /recomendacoes?...&busca=texto` (`api/app/routers/recomendacoes.py`). A busca entra na fase 2 do motor (`combina_com_busca` em `api/app/services/recomendacao.py`): todas as palavras digitadas precisam aparecer.
- Quem procura um lugar pelo nome quer achá-lo mesmo longe ou fechado. Por isso, com busca e sem raio informado, o raio vira o máximo (20 km, RN09), e os fechados aparecem com o selo "Fechado".
- App: `src/components/CampoBusca.tsx` espera 350 ms depois da última tecla antes de buscar, para não chamar a API a cada letra.
- Testes: `test_busca_por_nome_ignora_acentos_e_maiusculas` e `test_busca_inclui_fechados_e_usa_o_raio_maximo`.

## 2. Por que recomendamos (RF11 e RN08 visíveis)

- No cartão, um selo azul com o motivo mais forte que o cartão ainda não mostra ("Dentro do seu orçamento", "Tem opção vegetariana").
- No detalhe, a seção **Por que recomendamos** lista todos os motivos e a nota de cada critério da pontuação ponderada (proximidade, avaliação, orçamento, perfil), em barras. É a fórmula do RN08 aparecendo para o usuário.
- Código: `src/components/detalhe/PorQueRecomendamos.tsx`. Os dados já vinham da API (`criterios` e `motivos`); o app guarda em memória as recomendações vistas (`recomendacaoVista` em `src/offline/cache.ts`) para o detalhe não precisar de outra chamada.

## 3. Modo offline e esqueletos de carregamento

- Cada tela guarda no aparelho a última resposta boa (lista de cada eixo, salvos, detalhes de cada lugar e os dados da conta) com `AsyncStorage`. Sem rede, a tela mostra essa cópia com o aviso "Sem conexão. Mostrando o que foi carregado às 14:05."
- O app aberto sem internet continua logado (antes ele saía da conta). Só sai quando a API responde que o token não vale mais (401).
- Ao sair da conta, toda a cópia offline é apagada, para não aparecer para outra pessoa no mesmo celular.
- Só a lista "padrão" (sem busca nem filtros) é guardada, para o aviso não mostrar um resultado filtrado como se fosse a lista completa.
- Enquanto carrega, a tela mostra cartões cinza no formato final (esqueletos) em vez de um círculo girando. Com "Reduzir movimento" ligado no celular, eles não pulsam.
- Código: `src/offline/cache.ts` e `src/components/ui/Esqueleto.tsx`.

## 4. Modo escuro

- Perfil › Aparência: **Automático** (segue o iPhone), **Claro** ou **Escuro**. A escolha fica salva no aparelho.
- Duas paletas em `src/theme/cores.ts`. A escura é um azul-marinho quase preto (o "mar à noite"), não um cinza genérico; o azul fica mais claro para continuar legível.
- Como funciona: `cores` lê a paleta do esquema atual na hora em que cada cor é usada. Os estilos das telas são criados por `criarEstilos` (`src/theme/tema.tsx`), que gera um `StyleSheet` por esquema e o refaz quando o esquema muda. O `TemaProvider` fica na raiz do app e escolhe o esquema antes de desenhar as telas.
- O mapa acompanha: Apple Maps com `userInterfaceStyle` e, na web, o OpenStreetMap com as cores invertidas.
- O que o app não desenha também acompanha: no celular, `Appearance.setColorScheme` faz a barra de rolagem, o teclado e os alertas do sistema seguirem a escolha do Perfil; na web, o `color-scheme` da página escurece as barras de rolagem. No simulador do PC, a faixa do indicador de início pega a cor do rodapé do app e a barra de rolagem fica escondida, como no celular.

## 5. Compartilhar um lugar

O botão no topo do detalhe (e o "Enviar") manda um texto pronto para o WhatsApp ou qualquer app:

```
Cantina Nonna Lúcia
Restaurante · ★ 4,7 (3 avaliações) · $$
📍 Rua São Bento, 820 - Centro
https://www.google.com/maps/search/?api=1&query=-21.7926,-48.1746

Encontrei no TourLocal
```

Código: `src/util/compartilhar.ts`.

## 6. Acessibilidade (RNF11)

- Cada cartão é lido como uma frase só pelo VoiceOver/TalkBack: nome, nota, categoria, preço, distância, tempo a pé, se está aberto, se é acessível e o motivo da recomendação.
- Escolhas únicas (orçamento, tempo, raio, aparência, tipo de local) são anunciadas como "botão de opção", e as múltiplas como "caixa de seleção".
- Botões só com texto curto ganharam nome completo ("Limpar filtros", "Denunciar a avaliação de Bruna", "Enviar para alguém").
- Contraste: um teste automático (`src/__tests__/cores.test.ts`) confere todos os pares de texto e fundo nos dois modos, com o mínimo de 4,5:1 da WCAG 2.1 AA. Ele achou dois problemas no tema claro, que foram corrigidos: o vermelho de erro sobre o fundo rosado (4,2:1) e a borda dos campos (1,8:1, abaixo dos 3:1 para contornos).

## 7. Testes do app e dados de demonstração

- O app ganhou testes automáticos com Jest (`npm test` em `apps/mobile`), que rodam no CI junto com os da API: contraste das paletas, regra de senha forte (a mesma da API), formatação, texto de compartilhamento e o armazenamento offline.
- `python -m app.demo` cria lugares fictícios no centro de Araraquara, três contas e avaliações, para apresentar o app sem depender de importação. O roteiro da apresentação está em [roteiro-demonstracao.md](roteiro-demonstracao.md).
