import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cores, degrade } from '../../theme/cores';
import { estilosLargura } from '../../theme/layout';

type Props = { titulo: string; subtitulo?: string; acima?: ReactNode; children?: ReactNode };

/**
 * Topo azul das telas das abas. Começa atrás da barra de status e da Dynamic Island
 * (iPhone 17 Pro) e desce o conteúdo pela área segura, sem nada ficar escondido.
 */
export function TopoGradiente({ titulo, subtitulo, acima, children }: Props) {
  const { top } = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={degrade}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.topo, { paddingTop: top + 12 }]}
    >
      <View style={[styles.interno, estilosLargura.conteudo]}>
        {acima}
        <Text style={styles.titulo} accessibilityRole="header">
          {titulo}
        </Text>
        {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
        {children}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  topo: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  interno: { gap: 6 },
  titulo: { fontSize: 32, fontWeight: '800', color: cores.primariaTexto, letterSpacing: -0.5 },
  subtitulo: { fontSize: 15, color: 'rgba(255, 255, 255, 0.85)' },
});
