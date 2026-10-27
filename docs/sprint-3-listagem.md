# Sprint 3: listagem dos três eixos

## Rota

`GET /recomendacoes?eixo=comer&lat=-21.79&lng=-48.17` (com login)

| Parâmetro | Descrição |
|---|---|
| `eixo` | `comer`, `ficar` ou `fazer` |
| `lat`, `lng` | Posição do usuário; usada só na consulta e nunca gravada (RN10) |
| `raio_km` | Opcional. Sem ele vale o raio do perfil e, sem perfil, 3 km (RN09). Máximo de 20 km (RN03) |
| `incluir_fechados` | `true` para mostrar também os fechados agora (RN02) |

Cada resultado traz nome, categorias, endereço, coordenadas, faixa de preço, acessibilidade, nota média, primeira foto, **distância, minutos a pé e minutos de carro (RF08)** e `aberto_agora` (`null` quando o lugar não informou horário).

## Como o motor funciona (`api/app/services/recomendacao.py`)

1. **Filtragem espacial.** Primeiro, um retângulo em volta do usuário (`geo.caixa_delimitadora`), que o banco resolve com o índice de latitude e longitude (RNF02). Depois, a distância exata pela fórmula de Haversine (`geo.haversine_km`), mantendo só o que está dentro do raio. Na mesma consulta, saem os estabelecimentos não verificados (RN01).
2. **Regras de negócio.** `horario.esta_aberto` confere os horários no fuso de São Paulo, inclusive faixas que passam da meia-noite. Os fechados saem da lista, a não ser que o usuário peça (RN02).
3. **Ordenação.** Do mais perto para o mais longe, até 50 resultados. A pontuação ponderada (RN08) entra na Sprint 4.

A nota média considera só avaliações publicadas; as denunciadas ficam de fora (RN06).

O tempo estimado usa velocidades médias configuráveis (`VELOCIDADE_A_PE_KMH`, padrão 4,5 km/h, e `VELOCIDADE_CARRO_KMH`, padrão 25 km/h) sobre a distância em linha reta. É uma estimativa simples; o tempo real pela rua aparece quando o usuário traça a rota (Sprint 5).

## App

- `src/components/EixoTela.tsx`: barra de localização, mapa, interruptor "Mostrar também os fechados agora" e a lista. Puxar a lista para baixo recarrega.
- `src/components/CartaoLugar.tsx`: nome, selo Aberto/Fechado, categoria, preço, nota, distância, tempos e endereço (♿ quando há acessibilidade).
- No celular, os lugares também aparecem como marcadores no mapa.
