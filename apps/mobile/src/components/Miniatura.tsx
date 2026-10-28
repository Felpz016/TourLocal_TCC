import { Image, StyleSheet, Text, View } from 'react-native';

import type { Eixo } from '../api/recomendacoes';
import { urlFoto } from '../api/gestao';
import { corDoLugar, cores } from '../theme/cores';
import { fonte } from '../theme/fontes';
import type { NomeIcone } from './ui/Icone';

export const ICONE_EIXO: Record<Eixo, NomeIcone> = {
  comer: 'restaurant',
  ficar: 'bed',
  fazer: 'compass',
};

/** Primeira letra "de verdade" do nome, pulando artigos como "O" e "A". */
export function inicial(nome: string) {
  const palavras = nome.trim().split(/\s+/);
  const util = palavras.find((p) => p.length > 2) ?? palavras[0] ?? '?';
  return util[0]!.toUpperCase();
}

type Props = { nome: string; foto?: string | null; tamanho?: number };

/**
 * Foto do local; sem foto, um selo colorido com a inicial do nome, como os
 * monogramas de contatos. Cada lugar mantém sempre a mesma cor.
 */
export function Miniatura({ nome, foto, tamanho = 72 }: Props) {
  const estilo = [styles.base, { width: tamanho, height: tamanho, borderRadius: tamanho * 0.26 }];
  if (foto) {
    return (
      <Image source={{ uri: urlFoto(foto) }} style={estilo} accessibilityIgnoresInvertColors />
    );
  }
  return (
    <View style={[estilo, styles.selo, { backgroundColor: corDoLugar(nome) }]}>
      <Text style={[styles.letra, { fontSize: tamanho * 0.5 }]}>{inicial(nome)}</Text>
      <View style={[styles.sol, { width: tamanho * 0.16, height: tamanho * 0.16 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  selo: { alignItems: 'center', justifyContent: 'center' },
  letra: { fontFamily: fonte.titulo, color: cores.primariaTexto, marginTop: -2 },
  sol: {
    position: 'absolute',
    top: '14%',
    right: '14%',
    borderRadius: 99,
    backgroundColor: cores.sol,
  },
});
