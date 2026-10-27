import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cores } from '../../theme/cores';
import { estilosLargura } from '../../theme/layout';

type Props = { titulo?: string; subtitulo?: string; children: ReactNode };

/** Moldura das telas de formulário: área segura, rolagem e teclado sem cobrir os campos. */
export function Tela({ titulo, subtitulo, children }: Props) {
  return (
    <SafeAreaView style={styles.area} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.area}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.conteudo, estilosLargura.conteudo]}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  area: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: 24, gap: 16, flexGrow: 1 },
  titulo: { fontSize: 26, fontWeight: '700', color: cores.texto },
  subtitulo: { fontSize: 16, color: cores.textoSecundario, marginTop: -8 },
});
