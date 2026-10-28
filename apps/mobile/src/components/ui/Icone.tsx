import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import { cores } from '../../theme/cores';

export type NomeIcone = ComponentProps<typeof Ionicons>['name'];

type Props = { nome: NomeIcone; tamanho?: number; cor?: string };

/** Ícones no estilo do iOS (Ionicons); decorativos, o texto ao lado é que é lido. */
export function Icone({ nome, tamanho = 20, cor = cores.texto }: Props) {
  return (
    <Ionicons
      name={nome}
      size={tamanho}
      color={cor}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
