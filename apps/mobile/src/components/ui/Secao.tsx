import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { cores } from '../../theme/cores';

type Props = { titulo: string; dica?: string; children: ReactNode; linha?: boolean };

/** Bloco de formulário com título; com `linha`, os filhos ficam lado a lado e quebram. */
export function Secao({ titulo, dica, children, linha = false }: Props) {
  return (
    <View style={styles.secao}>
      <Text style={styles.titulo} accessibilityRole="header">
        {titulo}
      </Text>
      {dica ? <Text style={styles.dica}>{dica}</Text> : null}
      <View style={linha ? styles.linha : styles.coluna}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  secao: { gap: 8 },
  titulo: { fontSize: 18, fontWeight: '700', color: cores.texto },
  dica: { fontSize: 14, color: cores.textoSecundario, marginTop: -4 },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  coluna: { gap: 12 },
});
