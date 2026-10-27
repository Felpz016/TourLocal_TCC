# Sprint 2: localização, mapa e dados iniciais

## O que entrou

| Item | Onde |
|---|---|
| GPS com consentimento (RF04) | `apps/mobile/src/localizacao/LocalizacaoContext.tsx` |
| Endereço manual quando o GPS falha ou é negado (RF05) | `apps/mobile/app/localizacao.tsx` e `GET /localizacao/geocodificar` |
| Mapa com a posição do usuário | `apps/mobile/src/components/Mapa.tsx` (celular) e `Mapa.web.tsx` (navegador) |
| Importação de lugares do OpenStreetMap (RF19) | `api/app/importacao/osm.py` |

## Localização no app

- Ao abrir uma das abas, o app pede a permissão de localização. A mensagem do pedido está em `app.json` (plugin `expo-location`).
- Se a permissão for negada ou o GPS falhar, a barra no topo oferece "Informar endereço" e "Tentar o GPS de novo".
- O endereço digitado vai para `GET /localizacao/geocodificar`, que consulta o Nominatim (OpenStreetMap) e devolve latitude e longitude.
- **Privacidade (RNF07, RN10):** a posição fica só na memória do app (`LocalizacaoContext`). Ela não é gravada no banco nem no aparelho, e é descartada ao sair da conta, porque o provedor é recriado a cada login.

## Mapa

- No celular, `react-native-maps` usa o Apple Maps (iOS) ou o Google Maps (Android) e funciona no Expo Go sem chave de API.
- No navegador, o `react-native-maps` não funciona, então `Mapa.web.tsx` mostra o mapa embutido do OpenStreetMap. O Expo escolhe o arquivo `.web.tsx` sozinho quando roda na web.
- Se o mapa não carregar, a barra de localização e a lista continuam funcionando (RNF08).

## Povoar a base com lugares reais

Com a API e o banco rodando:

```bash
docker compose exec api python -m app.importacao.osm --cidade Araraquara
```

Sem Docker, dentro de `api/`: `python -m app.importacao.osm --cidade Araraquara`.

- A consulta busca, dentro dos limites da cidade, restaurantes, lanchonetes, cafés, bares, sorveterias, hotéis, pousadas, hostels, museus, parques, pontos turísticos, mirantes, teatros, cinemas e centros culturais que tenham nome.
- Cada lugar recebe a categoria correspondente (`api/app/services/categorias.py`), o endereço, as coordenadas, a acessibilidade (`wheelchair=yes`) e, quando possível, os horários (`api/app/importacao/horarios.py` entende os formatos mais comuns do campo `opening_hours`).
- Pode rodar de novo quando quiser: cada lugar é identificado pelo id do OpenStreetMap (coluna `origem_externa`, migração `0003`), então os dados são atualizados em vez de duplicados. Lugares que um comerciante já assumiu não são sobrescritos (RN07).
- Os lugares importados entram como verificados, para a base de testes não ficar vazia (RN01). Use `--nao-verificar` para que precisem de aprovação do administrador.
- O OpenStreetMap tem dados abertos, mas incompletos: muitos lugares vêm sem horário ou sem endereço completo. Para a cidade-piloto, vale conferir e completar os principais.
