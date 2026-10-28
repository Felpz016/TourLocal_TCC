import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet } from 'react-native';

import type { Eixo } from '../api/recomendacoes';
import { urlFoto } from '../api/gestao';
import { Icone } from './ui/Icone';
import type { NomeIcone } from './ui/Icone';

export const ICONE_EIXO: Record<Eixo, NomeIcone> = {
  comer: 'restaurant',
  ficar: 'bed',
  fazer: 'compass',
};

type Props = { foto?: string | null; eixo?: Eixo; tamanho?: number };

/** Foto do local; sem foto, um quadro azul-claro com o ícone do eixo. */
export function Miniatura({ foto, eixo, tamanho = 84 }: Props) {
  const estilo = [styles.base, { width: tamanho, height: tamanho }];
  if (foto) {
    return <Image source={{ uri: urlFoto(foto) }} style={estilo} accessibilityIgnoresInvertColors />;
  }
  return (
    <LinearGradient colors={['#EAF2FF', '#D6E6FF']} style={[estilo, styles.vazia]}>
      <Icone nome={eixo ? ICONE_EIXO[eixo] : 'location'} tamanho={tamanho * 0.36} cor="#3B82F6" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 16 },
  vazia: { alignItems: 'center', justifyContent: 'center' },
});
