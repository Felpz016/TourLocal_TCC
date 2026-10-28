import { Image, StyleSheet, Text, View } from 'react-native';

import type { Eixo } from '../api/recomendacoes';
import { urlFoto } from '../api/gestao';
import { tomDoLugar } from '../theme/cores';
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
 * Foto do local; sem foto, um selo em tom claro com a inicial do nome, como os
 * avatares de contato. Cada lugar mantém sempre o mesmo tom.
 */
export function Miniatura({ nome, foto, tamanho = 72 }: Props) {
  const estilo = [styles.base, { width: tamanho, height: tamanho, borderRadius: tamanho * 0.22 }];
  if (foto) {
    return (
      <Image source={{ uri: urlFoto(foto) }} style={estilo} accessibilityIgnoresInvertColors />
    );
  }
  const tom = tomDoLugar(nome);
  return (
    <View style={[estilo, styles.selo, { backgroundColor: tom.fundo }]}>
      <Text style={[styles.letra, { fontSize: tamanho * 0.42, color: tom.letra }]}>
        {inicial(nome)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  selo: { alignItems: 'center', justifyContent: 'center' },
  letra: { fontFamily: fonte.titulo, marginTop: -2 },
});
