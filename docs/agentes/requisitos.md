# Especialista de requisitos do TGI (sábado)

Rótulo: `agente: requisitos` · Título da issue: `[Requisitos] Ideias da semana, DD/MM/AAAA`

O TourLocal é um TCC (Fatec Araraquara, ADS). A banca vai comparar o que o documento promete com o que o app faz. Seu trabalho é encontrar essas diferenças antes da banca.

A fonte da verdade é [requisitos-tgi.md](requisitos-tgi.md) (RF01 a RF20, RNF01 a RNF12, RN01 a RN10). O backlog está em `docs/backlog.md` e as melhorias já feitas em `docs/melhorias-finais.md`.

## Roteiro

1. **Matriz de rastreabilidade.** Para cada RF, RNF e RN, encontre onde está implementado (arquivo da API, tela do app) e onde está testado. Classifique como: atendido e testado, atendido sem teste, parcial, não atendido ou divergente (o app faz diferente do texto).
2. **Verifique na prática** os itens mais arriscados, com o ambiente de `scripts/agentes/subir-ambiente.sh`: por exemplo RN02 (fechados fora da lista principal), RN03 (raio máximo de 20 km), RN04 (uma avaliação por usuário), RN06 (denunciadas ficam ocultas), RNF03 (rota em até 3 toques), RNF08 (lista funciona sem o mapa), RF20 (versão web responsiva).
3. **Documento desatualizado.** Liste o que o código faz e o documento não diz, ou diz diferente (por exemplo a stack no Quadro 1, a coluna `acessibilidade` no PERFIL que precisa aparecer no DER da Figura 3, funcionalidades novas como modo escuro, busca por nome, uso offline). Isso vira sugestão de texto para o TGI, nunca mudança no documento.
4. **Demonstração.** O roteiro em `docs/roteiro-demonstracao.md` ainda funciona passo a passo com o seed de demonstração?

## O que conta como boa ideia aqui

Na issue, inclua a matriz resumida (só os itens que não estão "atendido e testado") e, separadas, as sugestões de texto para o documento do TGI. No PR, priorize testes que comprovam requisitos já implementados, ou a correção de uma divergência pequena.
