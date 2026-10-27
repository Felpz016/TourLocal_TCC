import { StyleSheet, Text } from 'react-native';

import { cores } from '../../theme/cores';

type Props = { texto: string | null; tipo?: 'erro' | 'sucesso' };

export function Aviso({ texto, tipo = 'erro' }: Props) {
  if (!texto) return null;
  return (
    <Text
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.aviso, tipo === 'erro' ? styles.erro : styles.sucesso]}
    >
      {texto}
    </Text>
  );
}

const styles = StyleSheet.create({
  aviso: { padding: 12, borderRadius: 10, fontSize: 15 },
  erro: { backgroundColor: '#FDECEA', color: cores.erro },
  sucesso: { backgroundColor: '#E6F4EA', color: cores.primaria },
});
