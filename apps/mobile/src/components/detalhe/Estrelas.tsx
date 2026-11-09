import { Pressable, View } from 'react-native';

import { cores } from '../../theme/cores';
import { estrelasDaNota, formatarNota } from '../../util/formato';
import { vibrar } from '../../util/vibracao';
import { Icone } from '../ui/Icone';
import { criarEstilos } from '../../theme/tema';

type Props = { nota: number; onChange?: (nota: number) => void; tamanho?: number };

/** Mostra a nota em estrelas, com meia estrela (4,5 não aparece como 5,0); com onChange, cada estrela vira um botão de 1 a 5 (RF13). */
export function Estrelas({ nota, onChange, tamanho = 16 }: Props) {
  const styles = useEstilos();
  if (!onChange) {
    // A meia estrela é a metade colorida desenhada por cima de uma estrela cinza inteira,
    // para manter o contorno das cinco estrelas igual em qualquer nota.
    return (
      <View style={styles.linha} accessible accessibilityLabel={`Nota ${formatarNota(nota)} de 5`}>
        {estrelasDaNota(nota).map((preenchimento, i) => (
          <View key={i}>
            <Icone
              nome="star"
              tamanho={tamanho}
              cor={preenchimento === 'cheia' ? cores.estrela : cores.divisoria}
            />
            {preenchimento === 'meia' ? (
              <View style={styles.metade}>
                <Icone nome="star-half" tamanho={tamanho} cor={cores.estrela} />
              </View>
            ) : null}
          </View>
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
  metade: { position: 'absolute', top: 0, left: 0 },
  botao: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
}));
