# Roteiro de demonstração (banca)

Um passeio de uns 10 minutos pelo app, com dados prontos em Araraquara, que mostra cada requisito funcionando. Os lugares são fictícios e ficam no centro da cidade, então a demonstração funciona igual em qualquer dia, sem depender de importação do OpenStreetMap.

## Antes da apresentação

1. Suba o banco e a API (`iniciar.cmd` no Windows, ou `docker compose up --build`).
2. Crie os dados de demonstração:

   ```bash
   docker compose exec api python -m app.demo
   ```

   Pode rodar de novo quando quiser: os lugares são atualizados, não duplicados. Para apagar tudo depois, `python -m app.demo --limpar`.

3. Contas criadas (senha de todas: `Demo@2026`):

   | Perfil | E-mail |
   |--------|--------|
   | Turista (orçamento econômico, vegetariana) | `turista@demo.tourlocal.app` |
   | Comerciante (dono da Cantina e de um hotel pendente) | `comerciante@demo.tourlocal.app` |
   | Administrador | `admin@demo.tourlocal.app` |

4. Localização: os lugares ficam em volta da Praça Pedro de Toledo (-21.7946, -48.1756). No simulador do PC, ajuste em F12 › ⋮ › More tools › Sensors › Location. No celular fora de Araraquara, use Perfil › Localização, digite "Praça Pedro de Toledo, Araraquara" e toque em "Usar este endereço".

5. Faça um ensaio com a internet ligada: assim o app guarda a lista e os detalhes para o passo do modo offline.

## Passo a passo

| # | O que fazer | O que mostrar | Requisitos |
|---|-------------|---------------|------------|
| 1 | Entrar como turista | Senha forte, login, sessão salva | RF01, RF02 |
| 2 | Aba **Comer** | Mapa e lista ordenada pela pontuação, tempo a pé em cada cartão | RF06, RF07, RF08 |
| 3 | Ler o selo azul do cartão ("Dentro do seu orçamento", "Tem opção vegetariana") | O motivo de cada recomendação, vindo do perfil da turista | RF11, RN08 |
| 4 | Digitar **cafe** na busca | Acha "Café da Praça" ignorando acento; mostra "Fechado" se for depois das 20h, porque na busca o fechado também aparece | Busca por nome |
| 5 | Abrir **Filtros**: preço $ e nota 4+ | A lista encolhe; "Limpar" volta | RF09 |
| 6 | Abrir **Cantina Nonna Lúcia** | Horários, "Aberto · Fecha às 23:00", selos, avaliações | RF10 |
| 7 | Rolar até **Por que recomendamos** | Motivos em texto e a nota de cada critério (proximidade, avaliação, orçamento, perfil) que formam a pontuação | RF11, RN08 |
| 8 | Tocar em **Rotas** e em **Compartilhar** | Abre o app de mapas; o texto pronto vai para o WhatsApp com nota, endereço e link | RF12 |
| 9 | Dar 5 estrelas e salvar no coração | Avaliação e Salvos | RF13, RF14 |
| 10 | Ligar o **modo avião** e puxar a lista | Aviso "Sem conexão. Mostrando o que foi carregado às…" e a lista continua; Salvos e detalhes também abrem | Modo offline |
| 11 | Perfil › Aparência › **Escuro** | O app inteiro troca de tema na hora, inclusive o mapa | Modo escuro |
| 12 | Ativar o VoiceOver (iPhone) e passar o dedo num cartão | Lê nome, nota, distância, se está aberto e o motivo da recomendação | RNF11 |
| 13 | Sair e entrar como comerciante | Meus locais, editar a Cantina, "Hotel Boulevard Novo" aguardando verificação | RF15 a RF17 |
| 14 | Sair e entrar como administrador | Moderação: aprovar o hotel novo; ele passa a aparecer em **Ficar** | RF18, RN01 |

## Se algo der errado ao vivo

- **Lista vazia:** confira a localização (passo 4 da preparação) e se `python -m app.demo` rodou.
- **Tudo "Fechado":** os horários de demonstração vão das 7h às 23h (bar das 18h às 2h; hotéis 24h). Depois das 23h, ligue "Mostrar fechados agora" nos filtros.
- **Sem internet no auditório:** o modo offline mostra o que foi carregado no ensaio; por isso o ensaio do passo 5 é importante.
