import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { cores } from '../../theme/cores';
import { cartaoPlano, curva, raio } from '../../theme/estilo';
import { criarEstilos } from '../../theme/tema';

// Pulso lento, de cheio para meio apagado e de volta, como os carregamentos do App Store.
const PULSO = {
  animationName: { from: { opacity: 1 }, to: { opacity: 0.45 } },
  animationDuration: '900ms',
  animationIterationCount: 'infinite',
  animationDirection: 'alternate',
  animationTimingFunction: 'ease-in-out',
} as const;

/** Bloco cinza no lugar de um conteúdo que ainda está chegando. */
export function Bloco({
  largura = '100%',
  altura = 12,
  style,
}: {
  largura?: DimensionValue;
  altura?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useEstilos();
  return <View style={[styles.bloco, { width: largura, height: altura }, style]} />;
}

/** Desenho de um cartão de lugar enquanto a lista carrega: a tela já mostra a forma final. */
export function CartaoEsqueleto() {
  const styles = useEstilos();
  return (
    <View style={styles.cartao}>
      <Bloco largura={64} altura={64} style={styles.miniatura} />
      <View style={styles.linhas}>
        <Bloco largura="70%" altura={16} />
        <Bloco largura="40%" />
        <Bloco largura="85%" />
        <Bloco largura="30%" />
      </View>
    </View>
  );
}

/** Vários cartões pulsando juntos; o leitor de tela ouve só "Carregando". */
export function ListaEsqueleto({ quantidade = 4 }: { quantidade?: number }) {
  const movimentoReduzido = useReducedMotion();
  return (
    <Animated.View
      style={[{ gap: 10 }, movimentoReduzido ? null : PULSO]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando"
    >
      {Array.from({ length: quantidade }, (_, i) => (
        <CartaoEsqueleto key={i} />
      ))}
    </Animated.View>
  );
}

/** Pulso para qualquer conteúdo de esqueleto (ex.: a tela de detalhes). */
export function Pulsando({ children }: { children: ReactNode }) {
  const movimentoReduzido = useReducedMotion();
  return (
    <Animated.View
      style={movimentoReduzido ? null : PULSO}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando"
    >
      {children}
    </Animated.View>
  );
}

const useEstilos = criarEstilos(() => ({
  bloco: { borderRadius: raio.selo, ...curva, backgroundColor: cores.esqueleto },
  cartao: { flexDirection: 'row', gap: 14, padding: 14, borderRadius: raio.cartao, ...cartaoPlano },
  miniatura: { borderRadius: raio.bloco },
  linhas: { flex: 1, gap: 8, justifyContent: 'center' },
}));
