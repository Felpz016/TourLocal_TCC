import { cores } from './cores';
import { fonte } from './fontes';

// Cabeçalho nativo claro e sem linha, com o texto "Voltar" escondido como no iOS atual.
export const opcoesCabecalho = {
  headerTintColor: cores.primaria,
  headerStyle: { backgroundColor: cores.fundo },
  headerShadowVisible: false,
  headerTitleStyle: { fontFamily: fonte.subtitulo, fontSize: 18, color: cores.texto },
  headerBackButtonDisplayMode: 'minimal' as const,
  contentStyle: { backgroundColor: cores.fundo },
};
