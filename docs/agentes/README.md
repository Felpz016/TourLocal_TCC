# Agentes de melhoria do TourLocal

Sete especialistas automáticos analisam o TourLocal toda semana, cada um na sua área, e trazem ideias de melhoria. Eles rodam sozinhos às 8h (horário de Brasília), na nuvem, e **nunca mudam o `main` sem a sua revisão**: o que eles implementam chega como PR em rascunho, que você aprova e faz o merge.

| Dia | Especialista | Arquivo de instruções | Rótulo |
|-----|--------------|-----------------------|--------|
| Segunda | UX e visual | [ux.md](ux.md) | `agente: ux` |
| Terça | Acessibilidade | [acessibilidade.md](acessibilidade.md) | `agente: acessibilidade` |
| Quarta | Qualidade de código e testes | [codigo.md](codigo.md) | `agente: código` |
| Quinta | Segurança da API | [seguranca.md](seguranca.md) | `agente: segurança` |
| Sexta | Desempenho | [desempenho.md](desempenho.md) | `agente: desempenho` |
| Sábado | Requisitos do TGI | [requisitos.md](requisitos.md) | `agente: requisitos` |
| Domingo | Produto e ideias novas | [produto.md](produto.md) | `agente: produto` |

## Como você conversa com eles

1. Toda semana cada especialista abre **uma issue** com o rótulo `ideias` e o rótulo dele, por exemplo "[UX] Ideias da semana, 09/11/2026". As ideias vêm numeradas e ordenadas por prioridade.
2. Ele também implementa **a ideia de maior prioridade** num **PR em rascunho**, com os testes passando e, quando fizer sentido, prints de antes e depois.
3. Para pedir outras ideias, **comente na issue**, por exemplo "faz a 2 e a 5" ou "a 3 não, porque…". Na próxima rodada o especialista lê seus comentários: implementa primeiro o que você pediu e não volta a sugerir o que você recusou.
4. Para aceitar, revise o PR, marque como "Ready for review" e faça o merge. Para recusar, feche o PR com um comentário dizendo o motivo, que ele também lê.

## Ajustando o comportamento

As instruções são arquivos Markdown nesta pasta. Para mudar o foco de um especialista, edite o arquivo dele por PR: a próxima rodada já usa a versão nova do `main`. As regras comuns a todos estão em [protocolo.md](protocolo.md).

## Ferramentas

- `bash scripts/agentes/subir-ambiente.sh`: sobe a API com SQLite e dados de demonstração e a versão web do app, sem Docker nem MySQL (API em `:8000`, web em `:8081`).
- `node scripts/agentes/capturar-telas.mjs <pasta>`: tira prints das telas principais em tema claro e escuro, em largura de celular e uma de desktop.
- [requisitos-tgi.md](requisitos-tgi.md): RFs, RNFs e regras de negócio copiados do TGI (Etapa 7), usados pelo especialista de requisitos e como referência por todos.
