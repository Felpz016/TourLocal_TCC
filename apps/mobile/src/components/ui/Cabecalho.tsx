import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cores } from '../../theme/cores';
import { fonte } from '../../theme/fontes';
import { estilosLargura } from '../../theme/layout';

type Props = { titulo: string; subtitulo?: string; acao?: ReactNode; children?: ReactNode };

/**
 * Título grande das abas, no estilo do iOS mas com a fonte do app. Desce pela área
 * segura, então nada fica atrás da Dynamic Island do iPhone 17 Pro.
 */
export function Cabecalho({ titulo, subtitulo, acao, children }: Props) {
  const { top } = useSafeAreaInsets();
  return (
    <View style={[styles.cabecalho, { paddingTop: top + 16 }]}>
      <View style={[styles.interno, estilosLargura.conteudo]}>
        <View style={styles.linha}>
          <Text style={styles.titulo} accessibilityRole="header">
            {titulo}
          </Text>
          {acao}
        </View>
        {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cabecalho: { paddingHorizontal: 20, paddingBottom: 8, backgroundColor: cores.fundo },
  interno: { gap: 4 },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { fontFamily: fonte.titulo, fontSize: 34, color: cores.texto, letterSpacing: -0.8 },
  subtitulo: { fontSize: 15, color: cores.textoSecundario },
});
