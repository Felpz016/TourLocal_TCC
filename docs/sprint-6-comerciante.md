# Sprint 6: painel do comerciante, fotos, moderação e versão web

Cobre as issues #25 a #29 (UC10, UC11 e UC12; RF15 a RF18 e RF20).

## Os três perfis no app

| Perfil | Aba inicial | O que faz |
|---|---|---|
| Turista | Comer | Recomendações, detalhes, avaliações e Salvos |
| Comerciante | Meus locais | Cadastra e edita os próprios locais e envia fotos |
| Administrador | Moderação | Aprova cadastros e decide denúncias |

As abas que não são do perfil ficam escondidas (`href: null` no `Tabs.Screen`). A API confere o perfil de novo em cada rota, então esconder a aba é só conforto: a segurança está no servidor.

## Cadastro e edição (RF15, RF16, RN01, RN07)

- `POST /estabelecimentos` (só comerciante) cria o local com `verificado = false`. Ele não aparece para turistas até um administrador aprovar.
- `PUT /estabelecimentos/{id}` troca todos os dados de uma vez, inclusive categorias e horários. Só o dono ou um administrador consegue (RN07). Para os outros, a resposta é 404, para não revelar que um cadastro pendente existe.
- Se o comerciante muda **nome, endereço ou posição** de um local já verificado, ele volta a ficar pendente. Assim ninguém troca um cadastro aprovado por outro lugar. Telefone, horários e fotos não exigem nova verificação.
- **Fechado temporariamente** (nova coluna, migração `0006`): o local sai das recomendações, mesmo com "mostrar fechados", e os detalhes mostram o aviso.
- No formulário, a posição vem do endereço (o mesmo geocodificador da Sprint 2) ou do GPS do celular, e aparece no mapa para conferência.
- Horários: um por dia, com interruptor de aberto/fechado. Fechamento menor que a abertura significa que passa da meia-noite (mesma regra da Sprint 3).

## Fotos (RF17)

- `POST /estabelecimentos/{id}/fotos` recebe `multipart/form-data` com o campo `arquivo` e, opcionalmente, `legenda`. `DELETE /fotos/{id}` remove a foto e o arquivo.
- Limites configuráveis em `core/config.py`: até 5 MB por foto e 10 fotos por local.
- O formato é conferido pelos **primeiros bytes do arquivo** (assinatura de JPG, PNG ou WebP), não pela extensão. Um arquivo `.jpg` que na verdade é texto é recusado.
- O nome gravado é aleatório (`uuid4`), então ninguém sobrescreve a foto de outro local nem escolhe o caminho do arquivo.
- Os arquivos ficam na pasta `uploads/`, servida pela API em `/uploads/...`. No Docker essa pasta é um volume, para não se perder ao recriar o contêiner. Em produção, `services/fotos.py` é o único lugar a trocar para usar um armazenamento em nuvem.
- No app, `expo-image-picker` abre a galeria do celular (ou o seletor de arquivos na web).

## Moderação (RF18, RN06)

- `GET /admin/estabelecimentos/pendentes`, `POST /admin/estabelecimentos/{id}/aprovar` e `DELETE /admin/estabelecimentos/{id}` (rejeitar apaga o cadastro pendente e as fotos; um local já verificado não pode ser rejeitado, responde 409).
- `GET /admin/avaliacoes/denunciadas` e `POST /admin/avaliacoes/{id}/decisao` com `{"manter": true}` (volta a ser publicada) ou `false` (removida de vez).
- O primeiro administrador é criado pelo terminal: `python -m app.criar_admin --nome ... --email ...`.

## Versão web responsiva (RF20, RNF05)

O mesmo código do app gera a versão web (`npx expo export --platform web`) e consome a mesma API. Em telas largas, o conteúdo fica numa coluna central de até 760 px (`src/theme/layout.ts`). Foi conferido em 320 px e 1920 px sem rolagem horizontal.

## Testes

`api/tests/test_gestao.py` tem 17 testes: cadastro pendente até a aprovação, turista sem acesso, categoria inválida, RN07, volta à verificação ao mudar o endereço, fechamento temporário, troca de horários, envio e remoção de foto, formato falso, tamanho e quantidade máximos, foto em local de outro comerciante, rejeição, moderação de denúncia (manter e remover) e rotas de admin protegidas.
