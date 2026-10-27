import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

import { cores } from '../../theme/cores';

type Props = TextInputProps & { rotulo: string; erro?: string | null };

export function Campo({ rotulo, erro, style, ...props }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <TextInput
        accessibilityLabel={rotulo}
        placeholderTextColor={cores.textoSecundario}
        style={[styles.input, erro ? styles.inputErro : null, style]}
        {...props}
      />
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  rotulo: { fontSize: 15, fontWeight: '600', color: cores.texto },
  input: {
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: cores.texto,
    backgroundColor: cores.fundoCampo,
  },
  inputErro: { borderColor: cores.erro },
  erro: { color: cores.erro, fontSize: 14 },
});
