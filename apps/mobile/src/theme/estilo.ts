import { Platform } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';

import { cores } from './cores';

// Cantos do app, do menor ao maior. `pilula` deixa o elemento redondo (círculos e chips).
// No iPhone, os cantos usam `curva` (borderCurve contínua), como os ícones do iOS.
export const raio = {
  selo: 8,
  icone: 10,
  campo: 12,
  bloco: 16,
  cartao: 18,
  folha: 28,
  pilula: 999,
};
export const curva = { borderCurve: 'continuous' } as const satisfies ViewStyle;

// Na web, os campos de texto já mostram o foco na borda azul da caixa; sem isto o navegador
// desenha por cima o próprio contorno (claro, inclusive no tema escuro). Os tipos do React
// Native não conhecem `outlineStyle: 'none'`, que só existe na web.
export const semContornoWeb: TextStyle =
  Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : {};

// Durações (ms): toque é quase imperceptível, folhas e telas seguem o sistema.
export const movimento = { toque: 120, estado: 180 } as const;

// Uma única sombra, só para o que flutua (botões sobre o mapa, folhas); cartões ficam
// planos com uma linha fina, como no Airbnb e no Google Maps. São "getters" para pegar as
// cores do esquema atual (claro ou escuro) quando os estilos da tela são criados.
export const sombra: ViewStyle = {
  get boxShadow() {
    return `0 1px 2px ${cores.sombra}, 0 8px 20px ${cores.sombra}`;
  },
};
export const sombraForte: ViewStyle = {
  get boxShadow() {
    return `0 6px 16px ${cores.sombra}`;
  },
};

export const cartaoPlano: ViewStyle = {
  ...curva,
  borderWidth: 1,
  get borderColor() {
    return cores.divisoria;
  },
  get backgroundColor() {
    return cores.superficie;
  },
};
