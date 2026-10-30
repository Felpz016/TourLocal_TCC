import { Text, View } from 'react-native';

import { cores } from '../../theme/cores';
import { raio } from '../../theme/estilo';
import { tamanho } from '../../theme/fontes';
import { Icone } from './Icone';
import { criarEstilos } from '../../theme/tema';

type Tipo = 'erro' | 'sucesso' | 'alerta';
type Props = { texto: string | null; tipo?: Tipo };

// Uma função, e não uma constante, para pegar as cores do esquema atual (claro ou escuro).
const estiloDo = (tipo: Tipo) =>
  ({
    erro: { fundo: cores.fundoErro, cor: cores.erro, icone: 'alert-circle' },
    sucesso: { fundo: cores.fundoDestaque, cor: cores.primariaEscura, icone: 'checkmark-circle' },
    alerta: { fundo: cores.fundoAlerta, cor: cores.alerta, icone: 'time' },
  })[tipo] as { fundo: string; cor: string; icone: 'alert-circle' | 'checkmark-circle' | 'time' };

export function Aviso({ texto, tipo = 'erro' }: Props) {
  const styles = useEstilos();
  if (!texto) return null;
  const e = estiloDo(tipo);
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.aviso, { backgroundColor: e.fundo }]}
    >
      <Icone nome={e.icone} cor={e.cor} />
      <Text style={[styles.texto, { color: e.cor }]}>{texto}</Text>
    </View>
  );
}

const useEstilos = criarEstilos(() => ({
  aviso: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: raio.campo },
  texto: { flex: 1, fontSize: tamanho.corpo, lineHeight: 21 },
}));
