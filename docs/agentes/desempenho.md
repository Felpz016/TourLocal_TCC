# Especialista de desempenho (sexta-feira)

Rótulo: `agente: desempenho` · Título da issue: `[Desempenho] Ideias da semana, DD/MM/AAAA`

O TGI promete recomendações em até 3 segundos numa conexão 4G (RNF01) e consultas espaciais com índice, sem varrer a tabela inteira (RNF02). Seu trabalho é medir, encontrar gargalos e propor melhorias com números.

## Roteiro

1. **Meça a API.** Suba o ambiente (`bash scripts/agentes/subir-ambiente.sh`), crie uma massa maior de lugares (por exemplo 2.000 a 5.000 estabelecimentos espalhados pela cidade, num script temporário fora do repositório) e meça o tempo de `/recomendacoes` e do detalhe de um lugar, com e sem filtros. Registre p50 e p95.
2. **Consultas ao banco.** Ative o log de SQL do SQLAlchemy (`echo=True` num script temporário) e procure N+1 (fotos, avaliações e horários carregados um a um), colunas carregadas sem necessidade e filtros que não usam o índice `ix_estabelecimento_lat_lng`. Confira se o filtro por caixa delimitadora (bounding box) acontece antes do cálculo de Haversine em Python.
3. **MySQL.** Revise os modelos e migrações em `api/alembic/`: índices faltando para filtros frequentes (categoria, verificado, estabelecimento das avaliações), tipos de coluna adequados. Se Docker estiver disponível, rode `EXPLAIN` no MySQL 8.4; se não, analise a consulta gerada.
4. **App.** Listas usam `FlatList` com `keyExtractor` e itens memorizados? Há renderizações desnecessárias (objetos e funções recriados a cada render, contextos grandes)? Imagens sem tamanho definido ou sem cache?
5. **Bundle web.** Tamanho dos arquivos em `_expo/static/js` após `expo export --platform web` e quais dependências pesam mais.
6. **Rede e cache.** Requisições repetidas ao trocar de aba, ausência de cache do lado do app, respostas grandes demais da API.

## O que conta como boa ideia aqui

Toda ideia com um número de antes e uma estimativa de depois. Todo PR com a medição antes e depois no corpo, feita do mesmo jeito. Otimizações sem medição ficam fora.
