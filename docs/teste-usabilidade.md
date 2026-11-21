# Protocolo do teste de usabilidade (RNF03)

O TGI promete, na seção de método, "um teste de usabilidade com um grupo de 5 a 10 participantes reais (NIELSEN, 2000)", registrando "a taxa de conclusão de tarefas, o tempo gasto e a ocorrência de erros" e "finalizando com a aplicação do questionário padrão System Usability Scale (SUS) (BROOKE, 1996)". O RNF03 exige rota em até três toques e **média SUS ≥ 68**, e o cronograma (Quadro 8) prevê o "Relatório de testes e pontuação SUS".

Este documento é o roteiro para aplicar esse teste e o script `python -m app.usabilidade.sus` calcula os resultados a partir das planilhas. Leve impresso: a ficha de tarefas (seção 4) e o questionário (seção 5), uma cópia por participante.

## 1. Participantes

- **De 5 a 10 pessoas** que não participaram do desenvolvimento. O próprio TGI (riscos) prevê recrutar estudantes do curso, mantendo o mínimo de cinco.
- Prefira pessoas que viajam ou já foram turistas numa cidade que não conheciam. Anote só um código (P01, P02…), a idade aproximada e se usa Android ou iPhone. **Não anote nome nem contato** na planilha (LGPD, como no RNF07).
- Antes de começar, leia o termo da seção 7 e peça o "de acordo" do participante.

## 2. Preparação (uma vez)

1. Suba o ambiente e os dados de demonstração, como em [roteiro-demonstracao.md](roteiro-demonstracao.md) (passos 1 e 2 da preparação). Os lugares fictícios ficam em volta da Praça Pedro de Toledo, em Araraquara.
2. Ajuste a localização do aparelho para a praça (-21.7946, -48.1756): no simulador do PC em F12 › Sensors › Location; no celular fora de Araraquara, cada participante faz isso na tarefa T6, então aplique a T6 **antes** da T1 nesse caso.
3. Aplique o teste entre 11h e 22h, para os lugares de demonstração estarem abertos.
4. Use sempre o mesmo aparelho e a mesma versão do app. Deixe um cronômetro à mão (o do celular serve) e uma folha para contar toques e erros.

## 3. Como conduzir cada sessão (uns 20 minutos)

1. Explique que **o app está sendo testado, não a pessoa**, e que pode pensar em voz alta.
2. Entregue o aparelho na tela de login. Leia cada tarefa em voz alta, exatamente como está escrita, e só então comece a cronometrar.
3. Não ensine o caminho. Se a pessoa travar por mais de 1 minuto ou pedir ajuda, dê uma dica curta e marque a tarefa como **ajuda**. Se desistir ou passar de 3 minutos, marque **não** e siga para a próxima.
4. Conte como **erro** cada vez que a pessoa entra numa tela que não leva à tarefa e precisa voltar, ou toca em algo que não responde como ela esperava.
5. Na T1, conte também os **toques** desde a tela inicial (aba Comer) até a tela de rota abrir. O RNF03 pede no máximo 3.
6. Ao final, entregue o questionário SUS (seção 5) e deixe a pessoa responder sozinha, sem pensar muito em cada item.
7. Pergunte o que ela mais gostou e o que mais atrapalhou, e anote as frases dela. Elas valem para a discussão do relatório.

## 4. Tarefas

A ordem segue o uso real: criar a conta, achar um lugar, decidir e chegar até ele. Cada tarefa está ligada a um requisito do TGI.

| # | Tarefa (leia assim para o participante) | Conclui quando… | Requisitos |
|---|------------------------------------------|-----------------|------------|
| T0 | "Crie uma conta de turista para você e diga ao app o que você prefere." | Chega à aba Comer depois de salvar as preferências | RF01, RF03 |
| T1 | "Você está com fome e quer almoçar perto daqui, num lugar aberto agora. Escolha um e peça o caminho até ele." | Abre o app de mapas com a rota | RF06, RF07, RF08, RF12, **RNF03 (≤ 3 toques)** |
| T2 | "Descubra por que o app recomendou esse lugar para você." | Lê o selo do cartão ou a seção "Por que recomendamos" | RF11 |
| T3 | "Um amigo indicou o Café da Praça. Encontre-o e veja até que horas ele fica aberto hoje." | Abre o detalhe do Café da Praça e diz o horário | Busca por nome, RF10 |
| T4 | "Guarde a Cantina Nonna Lúcia para ver depois e mostre onde ela ficou guardada." | Abre a aba Salvos com a Cantina | RF14 |
| T5 | "Você já comeu na Cantina. Dê uma nota e escreva um comentário." | A avaliação aparece no detalhe | RF13 |
| T6 | "Imagine que o GPS não funciona. Faça o app procurar lugares perto da Praça Pedro de Toledo, em Araraquara." | Volta à lista com o endereço digitado | RF05 |
| T7 | "Procure um lugar para passear à tarde que tenha acesso para cadeira de rodas." | Abre um lugar da aba Fazer marcado como "Acessível" (na demonstração: Parque Ecológico, Museu da Ferrovia ou Teatro Municipal) | RF06, RF10 |

T0 cria uma conta por participante, o que também permite que cada um avalie a Cantina na T5 (RN04, uma avaliação por usuário). Para a planilha, use o código da tarefa seguido de um nome curto, sempre igual (por exemplo `T1 Rota de um almoço aberto`).

### Ficha por participante

| Tarefa | Concluiu (sim / ajuda / não) | Tempo (s) | Erros | Toques até a rota (só T1) | Observações |
|--------|------------------------------|-----------|-------|---------------------------|-------------|
| T0 | | | | | |
| T1 | | | | | |
| T2 | | | | | |
| T3 | | | | | |
| T4 | | | | | |
| T5 | | | | | |
| T6 | | | | | |
| T7 | | | | | |

## 5. Questionário SUS

Instrução ao participante: "Para cada frase, marque de 1 (discordo totalmente) a 5 (concordo totalmente), pensando no aplicativo que você acabou de usar."

| # | Afirmação | 1 | 2 | 3 | 4 | 5 |
|---|-----------|---|---|---|---|---|
| 1 | Eu acho que gostaria de usar este aplicativo com frequência. | | | | | |
| 2 | Eu achei o aplicativo desnecessariamente complexo. | | | | | |
| 3 | Eu achei o aplicativo fácil de usar. | | | | | |
| 4 | Eu acho que precisaria da ajuda de uma pessoa com conhecimentos técnicos para usar o aplicativo. | | | | | |
| 5 | Eu achei que as várias funções do aplicativo estão bem integradas. | | | | | |
| 6 | Eu achei que o aplicativo apresenta muita inconsistência. | | | | | |
| 7 | Eu imagino que as pessoas aprenderão a usar este aplicativo rapidamente. | | | | | |
| 8 | Eu achei o aplicativo atrapalhado de usar. | | | | | |
| 9 | Eu me senti confiante ao usar o aplicativo. | | | | | |
| 10 | Eu precisei aprender várias coisas novas antes de conseguir usar o aplicativo. | | | | | |

Não mude a ordem nem o sentido das frases: o cálculo depende de os itens ímpares serem positivos e os pares, negativos. Se a banca perguntar sobre a tradução, ela segue o original de Brooke (1996), com "sistema" trocado por "aplicativo".

### Cálculo (Brooke, 1996)

Para cada participante: itens ímpares valem **resposta − 1**; itens pares valem **5 − resposta**. Some os 10 valores (de 0 a 40) e multiplique por **2,5**, o que dá uma pontuação de 0 a 100. O resultado do teste é a **média** das pontuações dos participantes, comparada com 68 (RNF03). A pontuação SUS não é porcentagem: 68 é a média de referência da escala.

## 6. Registro e cálculo automático

Passe as fichas para duas planilhas (Excel ou Google Planilhas) e exporte cada uma em CSV, com estas colunas:

- **SUS:** `participante,q1,q2,q3,q4,q5,q6,q7,q8,q9,q10` (uma linha por participante, respostas de 1 a 5).
- **Tarefas:** `participante,tarefa,concluiu,tempo_s,erros,toques` (uma linha por participante e tarefa; `concluiu` é `sim`, `ajuda` ou `nao`; `toques` só na T1, deixe vazio nas outras).

Então, na pasta `api/`:

```bash
python -m app.usabilidade.sus caminho/sus.csv --tarefas caminho/tarefas.csv
```

O script confere o preenchimento (avisa a linha com resposta fora de 1 a 5, coluna faltando ou participante repetido) e imprime, em Markdown, a pontuação de cada participante, a média, o desvio padrão, quantos ficaram em 68 ou mais, se o RNF03 foi atendido e, por tarefa, a taxa de conclusão sem ajuda, o tempo médio de quem concluiu, os erros por participante e os toques até a rota. As tabelas podem ir direto para o relatório.

Os arquivos `docs/usabilidade/exemplo-ficticio-*.csv` mostram o formato. **Os números deles são inventados**, servem só para testar o script, e não podem ir para o TGI.

## 7. Termo de participação (ler antes de começar)

"Este teste faz parte do Trabalho de Graduação do curso de Análise e Desenvolvimento de Sistemas da Fatec Araraquara. Você vai usar o aplicativo TourLocal para algumas tarefas curtas, e eu vou anotar o tempo e as dificuldades. O que está sendo avaliado é o aplicativo, não você. Seu nome não será registrado: você aparece só como um código (P01, P02…). A localização usada é a de um ponto fixo de Araraquara, não a sua. Você pode parar a qualquer momento, sem precisar explicar. Você concorda em participar?"

Confirme com o orientador se a Fatec pede um termo assinado. Se pedir, use este texto como base.

## 8. O que levar para o relatório

1. Perfil dos participantes (quantos, faixa de idade, Android ou iPhone), sem identificar ninguém.
2. Tabela de tarefas gerada pelo script, com um parágrafo sobre as tarefas com mais erros ou ajuda e as falas dos participantes.
3. Tabela SUS, a média e a conclusão sobre o RNF03.
4. Limitações: amostra pequena e não probabilística (como o próprio TGI já reconhece nas considerações finais), dados fictícios de uma única cidade e testes conduzidos pelo próprio autor.
5. O que foi corrigido no app por causa do teste, se houver.
