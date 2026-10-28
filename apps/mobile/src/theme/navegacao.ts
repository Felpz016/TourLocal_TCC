import { cores } from './cores';
import { fonte, tamanho } from './fontes';

// Cabeçalho nativo claro e sem linha, com o texto "Voltar" escondido como no iOS atual.
export const opcoesCabecalho = {
  headerTintColor: cores.primaria,
  headerStyle: { backgroundColor: cores.fundo },
  headerShadowVisible: false,
  headerTitleStyle: {
    fontFamily: fonte.subtitulo,
    fontSize: tamanho.cabecalho,
    color: cores.texto,
  },
  headerBackButtonDisplayMode: 'minimal' as const,
  contentStyle: { backgroundColor: cores.fundo },
};
