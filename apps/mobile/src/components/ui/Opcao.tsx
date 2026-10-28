import { Pressable, StyleSheet, Text } from 'react-native';

import { cores } from '../../theme/cores';
import { raio } from '../../theme/estilo';

type Props = { rotulo: string; selecionada: boolean; onPress: () => void };

/** Botão de escolha (chip) usado em listas de opções. */
export function Opcao({ rotulo, selecionada, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selecionada }}
      accessibilityLabel={rotulo}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selecionada && styles.chipSelecionado,
        pressed && { opacity: 0.75 },
      ]}
    >
      <Text style={[styles.texto, selecionada && styles.textoSelecionado]}>{rotulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
    borderRadius: raio.pilula,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipSelecionado: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  texto: { fontSize: 15, fontWeight: '500', color: cores.texto },
  textoSelecionado: { color: cores.primariaTexto, fontWeight: '700' },
});
