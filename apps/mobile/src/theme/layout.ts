import { StyleSheet } from 'react-native';

// RNF05 / RF20: na web, em telas largas, o conteúdo fica numa coluna central legível
// em vez de esticar até 1920 px. No celular, maxWidth não tem efeito.
export const LARGURA_MAXIMA = 760;

export const estilosLargura = StyleSheet.create({
  conteudo: { width: '100%', maxWidth: LARGURA_MAXIMA, alignSelf: 'center' },
});
