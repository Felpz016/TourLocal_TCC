import {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from '@expo-google-fonts/bricolage-grotesque';

// Títulos em Bricolage Grotesque (cara de guia de viagem); o corpo usa a fonte do
// sistema (SF Pro no iPhone), que é a mais legível em tamanhos pequenos.
export const arquivosDeFonte = {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
};

export const fonte = {
  titulo: 'BricolageGrotesque_700Bold',
  subtitulo: 'BricolageGrotesque_700Bold',
  destaque: 'BricolageGrotesque_600SemiBold',
};

// Escala única de tamanhos de texto, em pontos, inspirada nos estilos de texto do iOS
// (Dynamic Type). As telas usam estes nomes em vez de números soltos, para que títulos,
// rótulos e legendas tenham o mesmo tamanho em todo o app.
export const tamanho = {
  mini: 11, // rótulos em caixa alta e contadores
  legenda: 12,
  apoio: 13, // detalhes de cartão, dicas de campo
  rotulo: 14, // rótulos de campo e chips
  corpo: 15, // texto corrido
  campo: 16, // texto digitado e botões
  destaque: 17, // nome do lugar no cartão
  cabecalho: 18, // título do cabeçalho nativo e das seções de formulário
  secao: 20, // títulos de bloco ("Sobre", "Horários")
  titulo: 24, // títulos de cartão e de folha
  tela: 28, // título de tela e nome do lugar
  grande: 32, // título grande das abas
};
