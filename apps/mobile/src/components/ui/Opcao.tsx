import { Pressable, StyleSheet, Text } from 'react-native';

import { cores } from '../../theme/cores';

type Props = { rotulo: string; selecionada: boolean; onPress: () => void };

/** Botão de escolha (chip) usado em listas de opções. */
export function Opcao({ rotulo, selecionada, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selecionada }}
      accessibilityLabel={rotulo}
      onPress={onPress}
      style={[styles.chip, selecionada && styles.chipSelecionado]}
    >
      <Text style={[styles.texto, selecionada && styles.textoSelecionado]}>{rotulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipSelecionado: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  texto: { fontSize: 15, color: cores.texto },
  textoSelecionado: { color: cores.primariaTexto, fontWeight: '600' },
});
