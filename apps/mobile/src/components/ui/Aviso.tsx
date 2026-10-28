import { StyleSheet, Text, View } from 'react-native';

import { cores } from '../../theme/cores';
import { raio } from '../../theme/estilo';
import { Icone } from './Icone';

type Tipo = 'erro' | 'sucesso' | 'alerta';
type Props = { texto: string | null; tipo?: Tipo };

const ESTILO = {
  erro: { fundo: cores.fundoErro, cor: cores.erro, icone: 'alert-circle' },
  sucesso: { fundo: cores.fundoDestaque, cor: cores.primariaEscura, icone: 'checkmark-circle' },
  alerta: { fundo: cores.fundoAlerta, cor: cores.alerta, icone: 'time' },
} as const;

export function Aviso({ texto, tipo = 'erro' }: Props) {
  if (!texto) return null;
  const e = ESTILO[tipo];
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

const styles = StyleSheet.create({
  aviso: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: raio.campo },
  texto: { flex: 1, fontSize: 15, lineHeight: 21 },
});
