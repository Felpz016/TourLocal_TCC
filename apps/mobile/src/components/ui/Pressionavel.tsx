import { useState } from 'react';
import { Pressable } from 'react-native';
import type {
  PressableProps,
  PressableStateCallbackType,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { movimento } from '../../theme/estilo';

const PressableAnimado = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle> | ((estado: PressableStateCallbackType) => StyleProp<ViewStyle>);
  /** Quanto o elemento encolhe no toque; 1 desliga o efeito (linhas de lista). */
  escala?: number;
};

/**
 * Tudo o que se toca no app passa por aqui: o elemento encolhe um pouco assim que o dedo
 * encosta (antes de soltar), em 120 ms, como os botões do iOS. A animação é uma transição
 * do Reanimated, que roda na thread de interface e não trava se o app estiver ocupado.
 * Com "Reduzir movimento" ligado no celular, fica só a mudança de cor ou opacidade.
 */
export function Pressionavel({ style, escala = 0.97, onPressIn, onPressOut, ...props }: Props) {
  const [pressionado, setPressionado] = useState(false);
  const movimentoReduzido = useReducedMotion();
  const estilo = typeof style === 'function' ? style({ pressed: pressionado }) : style;

  return (
    <PressableAnimado
      // Um dedo que escorrega alguns pontos não cancela o toque.
      pressRetentionOffset={16}
      {...props}
      onPressIn={(e) => {
        setPressionado(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressionado(false);
        onPressOut?.(e);
      }}
      style={[
        estilo,
        {
          transform: [{ scale: pressionado && !movimentoReduzido ? escala : 1 }],
          transitionProperty: 'transform',
          transitionDuration: movimento.toque,
          transitionTimingFunction: 'ease-out',
        },
      ]}
    />
  );
}
