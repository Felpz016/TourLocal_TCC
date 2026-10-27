# Sprint 4: motor de recomendação e filtros

## Pontuação ponderada (RN08)

`api/app/services/pontuacao.py` dá a cada lugar uma nota de 0 a 1 em quatro critérios e soma com pesos que totalizam 1:

| Critério | Peso padrão | Como é calculado |
|---|---|---|
| Proximidade | 0,35 | 1 no ponto do usuário, caindo até 0 na borda do raio |
| Avaliação | 0,25 | Nota média de 1 a 5 convertida para 0 a 1; sem avaliações vale 0,5 |
| Orçamento | 0,20 | 1 se o lugar é da faixa do turista ou mais barato; 0,3 um nível acima; 0 dois níveis acima; 0,5 se faltar a informação |
| Perfil | 0,20 | Média do que o turista preencheu: opções para as restrições alimentares (só no eixo Comer), ida a pé curta em relação ao tempo disponível e acessibilidade |

Os pesos ficam em `app/core/config.py` (`PESO_PROXIMIDADE`, `PESO_AVALIACAO`, `PESO_ORCAMENTO`, `PESO_PERFIL`) e a classe `Pesos` recusa valores que não somem 1. Sem preferências declaradas, valem os pesos padrão e todo critério de perfil fica neutro (RN09).

**Exemplo.** Sem perfil, um lugar colado no usuário e sem avaliações recebe 0,35·1 + 0,25·0,5 + 0,20·0,5 + 0,20·0,5 = 0,675.

A lista sai da maior para a menor pontuação; em caso de empate, o mais perto vem primeiro.

## Restrições obrigatórias

- **Acessibilidade:** se o turista marcou que precisa, lugares sem acessibilidade saem da lista (fase 2).
- **Restrições alimentares:** o OpenStreetMap raramente informa dieta, então tratar isso como filtro obrigatório esvaziaria a lista. Por isso a dieta entra na pontuação de perfil, e os lugares que atendem sobem e mostram o motivo "Tem opção vegetariana". As opções vêm das tags `diet:*` do OpenStreetMap e ficam na nova coluna `estabelecimento.opcoes_alimentares` (migração `0004`). O comerciante poderá informá-las na Sprint 6.

## Por que foi recomendado (RF11)

Cada resultado traz `motivos`, frases curtas exibidas no cartão: "A 6 min a pé de você", "Bem avaliado (nota 4,6)", "Dentro do seu orçamento", "Tem opção vegetariana", "Acessível para cadeira de rodas". A resposta também traz `criterios`, com a nota de cada critério, útil para a análise de resultados do TCC.

## Filtros (RF09)

`GET /recomendacoes` aceita `categoria`, `faixa_preco` (pode repetir), `nota_minima` (1 a 5) e `incluir_fechados`. `GET /categorias?eixo=` lista as categorias para os botões de filtro. No app, os filtros ficam acima da lista.

## Nenhum resultado (exceção E1 do UC04)

Quando nada é encontrado, a resposta traz `raio_sugerido_km` (o dobro do raio, até 20 km). O app mostra "Buscar em até 6 km" e, se houver filtros ativos, "Limpar filtros".
