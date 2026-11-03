# Requisitos do TGI (Etapa 7)

Cópia dos Quadros 2, 3 e 4 do documento "TGI Etapa 7 – Entrega Final" do TourLocal, para os agentes de melhoria consultarem. O documento original é a fonte oficial: se houver diferença, vale o documento.

## Requisitos funcionais (Quadro 2)

| ID | Descrição | Prioridade |
|----|-----------|------------|
| RF01 | Permitir o cadastro de usuário mediante nome, endereço de e-mail e senha, com distinção entre os perfis turista e comerciante. | Essencial |
| RF02 | Permitir a autenticação do usuário e a recuperação de senha por e-mail. | Essencial |
| RF03 | Permitir ao turista definir o perfil de preferências, contemplando faixa de orçamento, restrições alimentares, necessidade de acessibilidade, tempo disponível e raio de busca. | Essencial |
| RF04 | Obter a localização do usuário por meio do GPS do dispositivo, mediante autorização explícita. | Essencial |
| RF05 | Permitir a informação manual de um endereço de referência quando o GPS estiver indisponível ou a permissão for negada. | Importante |
| RF06 | Apresentar as recomendações organizadas nos três eixos definidos: Onde Comer, Onde Ficar e O que Fazer. | Essencial |
| RF07 | Ordenar os resultados segundo a pontuação calculada pelo motor de recomendação. | Essencial |
| RF08 | Exibir, para cada resultado, a distância em relação ao usuário e o tempo estimado de deslocamento. | Importante |
| RF09 | Permitir a aplicação de filtros adicionais por categoria, faixa de preço, nota mínima e funcionamento no momento da consulta. | Essencial |
| RF10 | Exibir tela de detalhes contendo fotos, descrição, endereço, contato, horários de funcionamento e avaliações do estabelecimento. | Essencial |
| RF11 | Indicar ao usuário quais critérios motivaram a recomendação apresentada. | Desejável |
| RF12 | Traçar a rota entre a posição do usuário e o local selecionado, por integração com a API de mapas. | Essencial |
| RF13 | Permitir o registro de avaliação do estabelecimento, com nota de 1 a 5 e comentário textual. | Importante |
| RF14 | Permitir salvar locais como favoritos e consultá-los posteriormente. | Desejável |
| RF15 | Permitir ao comerciante cadastrar seu estabelecimento, informando dados, categoria e coordenadas geográficas. | Essencial |
| RF16 | Permitir ao comerciante atualizar informações, horários de funcionamento e situação de funcionamento temporário. | Essencial |
| RF17 | Permitir o envio de imagens do estabelecimento pelo comerciante. | Importante |
| RF18 | Disponibilizar ao administrador a moderação de avaliações denunciadas e a verificação dos cadastros de estabelecimentos. | Importante |
| RF19 | Importar dados iniciais de estabelecimentos a partir de API pública de lugares, de modo a povoar a base na implantação. | Desejável |
| RF20 | Disponibilizar as funcionalidades de consulta na versão web responsiva, com a mesma base de dados do aplicativo. | Importante |

## Requisitos não funcionais (Quadro 3)

| ID | Característica | Descrição |
|----|----------------|-----------|
| RNF01 | Desempenho | O tempo de resposta de uma consulta de recomendação não deve ultrapassar três segundos em conexão móvel de quarta geração. |
| RNF02 | Desempenho | As consultas espaciais devem empregar índices adequados e restringir-se ao raio definido no perfil, evitando varreduras completas de tabela. |
| RNF03 | Usabilidade | A interface deve permitir que o usuário alcance a rota de um local recomendado em, no máximo, três toques a partir da tela inicial, obtendo pontuação SUS igual ou superior a 68. |
| RNF04 | Portabilidade | O aplicativo deve funcionar em dispositivos Android 8.0 ou superior e iOS 13 ou superior; a versão web deve operar nas versões recentes dos navegadores Chrome, Firefox, Edge e Safari. |
| RNF05 | Compatibilidade | O layout deve adaptar-se a telas com largura entre 320 e 1920 pixels, sem perda de funcionalidade. |
| RNF06 | Segurança | As senhas devem ser armazenadas sob algoritmo de hash com sal (bcrypt ou Argon2) e toda a comunicação deve ocorrer sobre HTTPS com TLS. |
| RNF07 | Privacidade | A localização deve ser utilizada apenas durante a sessão de consulta, mediante consentimento expresso, não sendo armazenada de forma identificável, em conformidade com a LGPD. |
| RNF08 | Confiabilidade | Na indisponibilidade da API de mapas, o sistema deve degradar-se de forma controlada, exibindo a lista de recomendações sem o componente cartográfico. |
| RNF09 | Manutenibilidade | O código deve ser estruturado em camadas, versionado em repositório Git e aderente a um padrão de codificação único. |
| RNF10 | Disponibilidade | O ambiente de homologação deve apresentar disponibilidade mensal igual ou superior a 95%. |
| RNF11 | Acessibilidade | Os elementos de interface devem respeitar contraste mínimo e dispor de rótulos textuais compatíveis com leitores de tela. |
| RNF12 | Escalabilidade | A aplicação deve ser implantada em contêineres Docker, de modo a permitir a replicação de instâncias conforme a demanda. |

## Regras de negócio (Quadro 4)

| ID | Descrição |
|----|-----------|
| RN01 | Somente estabelecimentos com cadastro verificado pelo administrador são exibidos nas recomendações. |
| RN02 | Estabelecimentos fechados no momento da consulta não compõem a listagem principal, salvo solicitação explícita do usuário por meio de filtro. |
| RN03 | A busca restringe-se ao raio definido no perfil do turista, limitado a 20 quilômetros. |
| RN04 | Cada usuário pode registrar uma única avaliação por estabelecimento, facultada a edição posterior. |
| RN05 | A nota média do estabelecimento é recalculada a cada avaliação aprovada. |
| RN06 | Avaliações denunciadas permanecem ocultas até a conclusão da moderação. |
| RN07 | As informações de um estabelecimento somente podem ser alteradas pelo comerciante responsável pelo cadastro ou pelo administrador. |
| RN08 | A pontuação de recomendação resulta da soma ponderada dos critérios de proximidade, avaliação média, adequação ao orçamento e aderência ao perfil, cujos pesos somam a unidade. |
| RN09 | Na ausência de preferências declaradas, o sistema aplica os pesos padrão e o raio de busca inicial de três quilômetros. |
| RN10 | As coordenadas do usuário não são persistidas após o encerramento da sessão de consulta. |
