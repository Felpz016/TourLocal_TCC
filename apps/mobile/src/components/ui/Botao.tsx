import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { cores } from '../../theme/cores';

type Props = {
  titulo: string;
  onPress: () => void;
  carregando?: boolean;
  variante?: 'primario' | 'link';
};

export function Botao({ titulo, onPress, carregando = false, variante = 'primario' }: Props) {
  const link = variante === 'link';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: carregando, busy: carregando }}
      disabled={carregando}
      onPress={onPress}
      style={({ pressed }) => [
        link ? styles.link : styles.primario,
        pressed && { opacity: 0.7 },
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={cores.primariaTexto} />
      ) : (
        <Text style={link ? styles.textoLink : styles.textoPrimario}>{titulo}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primario: {
    backgroundColor: cores.primaria,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  textoPrimario: { color: cores.primariaTexto, fontSize: 16, fontWeight: '700' },
  link: { paddingVertical: 10, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  textoLink: { color: cores.primaria, fontSize: 16, fontWeight: '600' },
});
