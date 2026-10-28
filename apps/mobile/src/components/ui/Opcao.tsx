import { StyleSheet, Text } from 'react-native';

import { cores } from '../../theme/cores';
import { raio } from '../../theme/estilo';
import { tamanho } from '../../theme/fontes';
import { Pressionavel } from './Pressionavel';
import { vibrar } from '../../util/vibracao';

type Props = { rotulo: string; selecionada: boolean; onPress: () => void };

/** Botão de escolha (chip) usado em listas de opções. */
export function Opcao({ rotulo, selecionada, onPress }: Props) {
  return (
    <Pressionavel
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selecionada }}
      accessibilityLabel={rotulo}
      onPress={() => {
        vibrar.selecao();
        onPress();
      }}
      style={({ pressed }) => [
        styles.chip,
        selecionada && styles.chipSelecionado,
        pressed && { opacity: 0.75 },
      ]}
    >
      <Text style={[styles.texto, selecionada && styles.textoSelecionado]}>{rotulo}</Text>
    </Pressionavel>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
    borderRadius: raio.pilula,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipSelecionado: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  texto: { fontSize: tamanho.corpo, fontWeight: '500', color: cores.texto },
  textoSelecionado: { color: cores.primariaTexto, fontWeight: '700' },
});
