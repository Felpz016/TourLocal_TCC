import { cores } from './cores';

// Cabeçalho nativo claro e sem linha, com o texto "Voltar" escondido como no iOS atual.
export const opcoesCabecalho = {
  headerTintColor: cores.primaria,
  headerStyle: { backgroundColor: cores.fundo },
  headerShadowVisible: false,
  headerTitleStyle: { fontWeight: '700' as const, color: cores.texto },
  headerBackButtonDisplayMode: 'minimal' as const,
  contentStyle: { backgroundColor: cores.fundo },
};
