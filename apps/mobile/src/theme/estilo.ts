import type { ViewStyle } from 'react-native';

export const raio = { campo: 14, cartao: 22, pilula: 999 };

// Sombras quentes e baixas, como papel sobre a mesa (boxShadow vale no iOS, Android e web).
export const sombra: ViewStyle = {
  boxShadow: '0 1px 2px rgba(11, 27, 58, 0.06), 0 8px 20px rgba(11, 27, 58, 0.06)',
};
export const sombraForte: ViewStyle = { boxShadow: '0 10px 24px rgba(11, 27, 58, 0.22)' };
