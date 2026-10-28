import type { ViewStyle } from 'react-native';

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

// Durações (ms): toque é quase imperceptível, folhas e telas seguem o sistema.
export const movimento = { toque: 120, estado: 180 } as const;

// Uma única sombra, só para o que flutua (botões sobre o mapa, folhas); cartões ficam
// planos com uma linha fina, como no Airbnb e no Google Maps.
export const sombra: ViewStyle = {
  boxShadow: '0 1px 2px rgba(11, 27, 58, 0.06), 0 8px 20px rgba(11, 27, 58, 0.06)',
};
export const sombraForte: ViewStyle = { boxShadow: '0 6px 16px rgba(11, 27, 58, 0.16)' };

export const cartaoPlano: ViewStyle = {
  ...curva,
  borderWidth: 1,
  borderColor: cores.divisoria,
  backgroundColor: cores.superficie,
};
