import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cores } from '../../theme/cores';
import { fonte } from '../../theme/fontes';
import { estilosLargura } from '../../theme/layout';

type Props = {
  titulo?: string;
  subtitulo?: string;
  children: ReactNode;
  /** Botão principal fixo no rodapé, acima da barra de início do iPhone. */
  rodape?: ReactNode;
};

/** Moldura das telas de formulário: área segura, rolagem e teclado sem cobrir os campos. */
export function Tela({ titulo, subtitulo, children, rodape }: Props) {
  const { top, bottom } = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={styles.area}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      // O cabeçalho nativo ocupa a área segura de cima mais 44 pt de barra.
      keyboardVerticalOffset={Platform.OS === 'ios' ? top + 44 : 0}
    >
      <ScrollView
        contentContainerStyle={[
          styles.conteudo,
          { paddingBottom: rodape ? 24 : bottom + 24 },
          estilosLargura.conteudo,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {titulo ? (
          <Text style={styles.titulo} accessibilityRole="header">
            {titulo}
          </Text>
        ) : null}
        {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
        {children}
      </ScrollView>
      {rodape ? (
        <View style={[styles.rodape, { paddingBottom: Math.max(bottom, 12) }]}>
          <View style={estilosLargura.conteudo}>{rodape}</View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  area: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: 20, gap: 16, flexGrow: 1 },
  titulo: {
    fontFamily: fonte.titulo,
    fontSize: 30,
    lineHeight: 34,
    color: cores.texto,
    letterSpacing: -0.6,
  },
  subtitulo: { fontSize: 15, lineHeight: 21, color: cores.textoSecundario, marginTop: -8 },
  rodape: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: cores.superficie,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: cores.divisoria,
  },
});
