import { Pressable, View } from 'react-native';

import { cores } from '../../theme/cores';
import { vibrar } from '../../util/vibracao';
import { Icone } from '../ui/Icone';
import { criarEstilos } from '../../theme/tema';

type Props = { nota: number; onChange?: (nota: number) => void; tamanho?: number };

/** Mostra a nota em estrelas; com onChange, cada estrela vira um botão de 1 a 5 (RF13). */
export function Estrelas({ nota, onChange, tamanho = 16 }: Props) {
  const styles = useEstilos();
  if (!onChange) {
    return (
      <View style={styles.linha} accessible accessibilityLabel={`Nota ${nota} de 5`}>
        {[1, 2, 3, 4, 5].map((valor) => (
          <Icone
            key={valor}
            nome="star"
            tamanho={tamanho}
            cor={valor <= nota ? cores.estrela : cores.divisoria}
          />
        ))}
      </View>
    );
  }
  return (
    <View style={styles.linha} accessibilityRole="radiogroup" accessibilityLabel="Sua nota">
      {[1, 2, 3, 4, 5].map((valor) => (
        <Pressable
          key={valor}
          onPress={() => {
            if (valor !== nota) vibrar.selecao();
            onChange(valor);
          }}
          accessibilityRole="radio"
          accessibilityState={{ checked: valor === nota }}
          accessibilityLabel={`${valor} ${valor === 1 ? 'estrela' : 'estrelas'}`}
          hitSlop={4}
          style={styles.botao}
        >
          <Icone
            nome={valor <= nota ? 'star' : 'star-outline'}
            tamanho={32}
            cor={valor <= nota ? cores.estrela : cores.borda}
          />
        </Pressable>
      ))}
    </View>
  );
}

const useEstilos = criarEstilos(() => ({
  linha: { flexDirection: 'row', gap: 2, alignItems: 'center' },
  botao: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
}));
