import type { ViewStyle } from 'react-native';

export const raio = { campo: 14, cartao: 20, pilula: 999 };

// Sombra suave dos cartões (boxShadow funciona no iOS, no Android e na web).
export const sombra: ViewStyle = { boxShadow: '0 6px 16px rgba(15, 23, 42, 0.08)' };
export const sombraForte: ViewStyle = { boxShadow: '0 10px 24px rgba(30, 58, 138, 0.25)' };
