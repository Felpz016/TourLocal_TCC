import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cores } from '../../theme/cores';
import { curva, raio } from '../../theme/estilo';
import { tamanho } from '../../theme/fontes';
import { Icone } from './Icone';
import type { NomeIcone } from './Icone';

type Props = {
  icone: NomeIcone;
  titulo: string;
  detalhe?: string;
  onPress: () => void;
  perigo?: boolean;
  ultimo?: boolean;
};

/** Linha de menu no estilo dos Ajustes do iOS: ícone, texto e seta. */
export function ItemLista({
  icone,
  titulo,
  detalhe,
  onPress,
  perigo = false,
  ultimo = false,
}: Props) {
  const cor = perigo ? cores.erro : cores.primaria;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={detalhe ? `${titulo}, ${detalhe}` : titulo}
      style={({ pressed }) => [
        styles.item,
        !ultimo && styles.divisoria,
        pressed && styles.pressionado,
      ]}
    >
      <View
        style={[styles.icone, { backgroundColor: perigo ? cores.fundoErro : cores.fundoDestaque }]}
      >
        <Icone nome={icone} tamanho={18} cor={cor} />
      </View>
      <View style={styles.textos}>
        <Text style={[styles.titulo, perigo && { color: cores.erro }]}>{titulo}</Text>
        {detalhe ? (
          <Text style={styles.detalhe} numberOfLines={1}>
            {detalhe}
          </Text>
        ) : null}
      </View>
      {!perigo ? <Icone nome="chevron-forward" tamanho={18} cor={cores.textoSecundario} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, minHeight: 64 },
  divisoria: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: cores.borda },
  pressionado: { backgroundColor: cores.fundo },
  icone: {
    width: 36,
    height: 36,
    borderRadius: raio.icone,
    ...curva,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: { flex: 1, gap: 2 },
  titulo: { fontSize: tamanho.campo, fontWeight: '600', color: cores.texto },
  detalhe: { fontSize: tamanho.apoio, color: cores.textoSecundario },
});
