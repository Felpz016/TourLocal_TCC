import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

import { cores } from '../../theme/cores';
import { raio } from '../../theme/estilo';
import { Icone } from './Icone';
import type { NomeIcone } from './Icone';

type Props = TextInputProps & {
  rotulo: string;
  erro?: string | null;
  icone?: NomeIcone;
  dica?: string;
};

export function Campo({
  rotulo,
  erro,
  icone,
  dica,
  style,
  secureTextEntry,
  multiline,
  onFocus,
  onBlur,
  ...props
}: Props) {
  const [focado, setFocado] = useState(false);
  // Campos de senha ganham o botão de mostrar/ocultar, como no iOS.
  const [oculto, setOculto] = useState(!!secureTextEntry);

  return (
    <View style={styles.container}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <View
        style={[
          styles.caixa,
          multiline && styles.caixaMultilinha,
          focado && styles.caixaFocada,
          erro ? styles.caixaErro : null,
        ]}
      >
        {icone ? (
          <Icone nome={icone} cor={focado ? cores.primaria : cores.textoSecundario} />
        ) : null}
        <TextInput
          accessibilityLabel={rotulo}
          placeholderTextColor={cores.textoSecundario}
          secureTextEntry={oculto}
          multiline={multiline}
          onFocus={(e) => {
            setFocado(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocado(false);
            onBlur?.(e);
          }}
          style={[styles.input, style]}
          {...props}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setOculto((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={oculto ? 'Mostrar senha' : 'Ocultar senha'}
            hitSlop={10}
          >
            <Icone nome={oculto ? 'eye-outline' : 'eye-off-outline'} cor={cores.textoSecundario} />
          </Pressable>
        ) : null}
      </View>
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      {!erro && dica ? <Text style={styles.dica}>{dica}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  rotulo: { fontSize: 14, fontWeight: '600', color: cores.texto },
  caixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.campo,
    backgroundColor: cores.superficie,
  },
  caixaMultilinha: { alignItems: 'flex-start', paddingVertical: 12 },
  caixaFocada: { borderColor: cores.primaria, borderWidth: 2, paddingHorizontal: 13 },
  caixaErro: { borderColor: cores.erro },
  input: { flex: 1, minWidth: 0, fontSize: 16, color: cores.texto, paddingVertical: 12 },
  erro: { color: cores.erro, fontSize: 14 },
  dica: { color: cores.textoSecundario, fontSize: 13 },
});
