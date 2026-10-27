# Sprint 5: detalhes do local, rota, avaliações e salvos

Cobre as issues #21 a #24 (UC06, UC08 e UC09; RF10, RF12, RF13 e RF14).

## Endpoints novos

| Método e rota | Quem usa | O que faz |
|---|---|---|
| `GET /estabelecimentos/{id}?lat&lng` | qualquer usuário logado | Detalhes (RF10). Com `lat` e `lng`, inclui `distancia_km` |
| `GET /estabelecimentos/{id}/avaliacoes` | qualquer usuário logado | Até 100 avaliações publicadas, mais recentes primeiro |
| `PUT /estabelecimentos/{id}/avaliacao` | turista | Cria ou edita a avaliação dele (nota 1 a 5 e comentário) |
| `DELETE /estabelecimentos/{id}/avaliacao` | turista | Exclui a própria avaliação |
| `POST /avaliacoes/{id}/denuncia` | qualquer usuário logado | Marca a avaliação como denunciada |
| `GET /favoritos` | turista | Lista os locais salvos |
| `PUT` e `DELETE /favoritos/{id}` | turista | Salva ou remove um local; repetir não dá erro |

O código fica em `routers/estabelecimentos.py` (HTTP), `services/estabelecimento_service.py` (regras) e `repositories/avaliacao_repository.py` (consultas de média, que o motor de recomendação também usa).

## Regras de negócio aplicadas

- **RN01:** lugar não verificado responde 404 para turistas. O comerciante responsável e o administrador conseguem ver o próprio cadastro pendente.
- **RN04:** uma avaliação por usuário e local. O `PUT` faz "upsert": se já existe, edita; por isso a rota é `PUT .../avaliacao`, no singular.
- **RN05:** a média não é guardada numa coluna. Ela é calculada na consulta a partir das avaliações publicadas, então muda assim que alguém avalia.
- **RN06:** a denúncia muda o status para `denunciada`. A avaliação some da lista e da média até a moderação (Sprint 6) decidir. Ninguém denuncia a própria avaliação, e quem teve a avaliação removida pela moderação não pode reescrevê-la.

## Contato do estabelecimento

A migração `0005` adiciona `telefone` e `site` em `estabelecimento`. O importador do OpenStreetMap preenche os dois a partir das tags `phone`/`contact:phone` e `website`/`contact:website`.

## Telas

- **Cartão da lista:** agora é um botão que abre os detalhes.
- **Detalhes (`app/lugar/[id].tsx`):** fotos, selos (aberto agora, acessível, opções alimentares), botão "Como chegar", telefone, site, descrição, horários da semana e avaliações. O coração no cabeçalho salva o local.
- **Como chegar (RF12):** `src/util/rota.ts` abre o Apple Maps no iPhone e o Google Maps no Android e na web, com o destino já preenchido. Da aba até a rota são dois toques: cartão e "Como chegar" (RNF03 pede no máximo três).
- **Avaliar:** cinco estrelas grandes (44 px de área de toque) e comentário opcional. Depois de publicar, aparecem "Editar minha avaliação" e "Excluir".
- **Denunciar:** pede confirmação na própria linha, sem janela, para funcionar igual no celular e na web.
- **Salvos:** nova aba, visível só para turistas, que recarrega toda vez que é aberta.

## Testes

`api/tests/test_estabelecimentos.py` tem 18 testes: detalhes com e sem distância, 404 para pendente, administrador vendo pendente, upsert da avaliação, média de duas avaliações, nota fora de 1 a 5, comerciante recebendo 403, exclusão, denúncia escondendo da lista e da média, avaliação removida, e favoritos (inclusão repetida, remoção e isolamento por usuário).
