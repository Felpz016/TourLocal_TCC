import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cores } from '../../theme/cores';

type Props = { nota: number; onChange?: (nota: number) => void; tamanho?: number };

/** Mostra a nota em estrelas; com onChange, cada estrela vira um botão de 1 a 5 (RF13). */
export function Estrelas({ nota, onChange, tamanho = 18 }: Props) {
  if (!onChange) {
    return (
      <Text style={{ fontSize: tamanho, color: cores.estrela }} accessibilityLabel={`Nota ${nota}`}>
        {'★'.repeat(nota)}
        <Text style={{ color: cores.borda }}>{'★'.repeat(5 - nota)}</Text>
      </Text>
    );
  }
  return (
    <View style={styles.linha} accessibilityRole="radiogroup" accessibilityLabel="Sua nota">
      {[1, 2, 3, 4, 5].map((valor) => (
        <Pressable
          key={valor}
          onPress={() => onChange(valor)}
          accessibilityRole="radio"
          accessibilityState={{ checked: valor === nota }}
          accessibilityLabel={`${valor} ${valor === 1 ? 'estrela' : 'estrelas'}`}
          hitSlop={4}
          style={styles.botao}
        >
          <Text style={{ fontSize: 32, color: valor <= nota ? cores.estrela : cores.borda }}>
            ★
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', gap: 4 },
  botao: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
