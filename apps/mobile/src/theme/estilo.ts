import type { ViewStyle } from 'react-native';

import { cores } from './cores';

export const raio = { campo: 12, cartao: 18, pilula: 999 };

// Uma única sombra, só para o que flutua (botões sobre o mapa, folhas); cartões ficam
// planos com uma linha fina, como no Airbnb e no Google Maps.
export const sombra: ViewStyle = {
  boxShadow: '0 1px 2px rgba(11, 27, 58, 0.06), 0 8px 20px rgba(11, 27, 58, 0.06)',
};
export const sombraForte: ViewStyle = { boxShadow: '0 6px 16px rgba(11, 27, 58, 0.16)' };

export const cartaoPlano: ViewStyle = {
  borderWidth: 1,
  borderColor: cores.divisoria,
  backgroundColor: cores.superficie,
};
