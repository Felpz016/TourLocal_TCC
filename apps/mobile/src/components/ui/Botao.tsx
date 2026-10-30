import { ActivityIndicator, Text } from 'react-native';

import { cores } from '../../theme/cores';
import { curva, raio, sombraForte } from '../../theme/estilo';
import { tamanho } from '../../theme/fontes';
import { Icone } from './Icone';
import type { NomeIcone } from './Icone';
import { Pressionavel } from './Pressionavel';
import { criarEstilos } from '../../theme/tema';

type Variante = 'primario' | 'secundario' | 'perigo' | 'link';

type Props = {
  titulo: string;
  onPress: () => void;
  carregando?: boolean;
  variante?: Variante;
  icone?: NomeIcone;
  /** Em linha com outros botões, divide o espaço em vez de ocupar a largura toda. */
  flexivel?: boolean;
};

const corTexto = (variante: Variante) =>
  ({
    primario: cores.primariaTexto,
    secundario: cores.primaria,
    perigo: cores.erro,
    link: cores.primaria,
  })[variante];

export function Botao({
  titulo,
  onPress,
  carregando = false,
  variante = 'primario',
  icone,
  flexivel = false,
}: Props) {
  const styles = useEstilos();
  const cor = corTexto(variante);
  return (
    <Pressionavel
      accessibilityRole="button"
      accessibilityState={{ disabled: carregando, busy: carregando }}
      disabled={carregando}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variante],
        flexivel && styles.flexivel,
        pressed && { opacity: 0.85 },
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={cor} />
      ) : (
        <>
          {icone ? <Icone nome={icone} tamanho={18} cor={cor} /> : null}
          <Text style={[styles.texto, { color: cor }, variante === 'link' && styles.textoLink]}>
            {titulo}
          </Text>
        </>
      )}
    </Pressionavel>
  );
}

const useEstilos = criarEstilos(() => ({
  base: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: raio.campo,
    ...curva,
  },
  flexivel: { flex: 1 },
  primario: { backgroundColor: cores.primaria, ...sombraForte },
  secundario: { borderWidth: 1.5, borderColor: cores.primaria, backgroundColor: cores.superficie },
  perigo: { borderWidth: 1.5, borderColor: cores.erro, backgroundColor: cores.superficie },
  link: { minHeight: 44, paddingHorizontal: 8 },
  texto: { fontSize: tamanho.campo, fontWeight: '700' },
  textoLink: { fontWeight: '600' },
}));
