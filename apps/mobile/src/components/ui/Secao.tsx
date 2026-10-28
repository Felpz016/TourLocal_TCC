import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { cores } from '../../theme/cores';
import { raio } from '../../theme/estilo';
import { fonte } from '../../theme/fontes';
import { Icone } from './Icone';
import type { NomeIcone } from './Icone';

type Props = {
  titulo: string;
  dica?: string;
  icone?: NomeIcone;
  children: ReactNode;
  linha?: boolean;
};

/** Cartão de formulário com título; com `linha`, os filhos ficam lado a lado e quebram. */
export function Secao({ titulo, dica, icone, children, linha = false }: Props) {
  return (
    <View style={styles.secao}>
      <View style={styles.topo}>
        {icone ? (
          <View style={styles.icone}>
            <Icone nome={icone} tamanho={18} cor={cores.primaria} />
          </View>
        ) : null}
        <View style={styles.textos}>
          <Text style={styles.titulo} accessibilityRole="header">
            {titulo}
          </Text>
          {dica ? <Text style={styles.dica}>{dica}</Text> : null}
        </View>
      </View>
      <View style={linha ? styles.linha : styles.coluna}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  secao: {
    gap: 14,
    padding: 16,
    borderRadius: raio.cartao,
    borderWidth: 1,
    borderColor: cores.divisoria,
    backgroundColor: cores.superficie,
  },
  topo: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  icone: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.fundoDestaque,
  },
  textos: { flex: 1, gap: 2 },
  titulo: { fontFamily: fonte.subtitulo, fontSize: 18, color: cores.texto },
  dica: { fontSize: 13, color: cores.textoSecundario },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  coluna: { gap: 12 },
});
