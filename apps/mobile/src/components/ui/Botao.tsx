import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { cores } from '../../theme/cores';
import { raio, sombraForte } from '../../theme/estilo';
import { Icone } from './Icone';
import type { NomeIcone } from './Icone';

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

const corTexto: Record<Variante, string> = {
  primario: cores.primariaTexto,
  secundario: cores.primaria,
  perigo: cores.erro,
  link: cores.primaria,
};

export function Botao({
  titulo,
  onPress,
  carregando = false,
  variante = 'primario',
  icone,
  flexivel = false,
}: Props) {
  const cor = corTexto[variante];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: carregando, busy: carregando }}
      disabled={carregando}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variante],
        flexivel && styles.flexivel,
        pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] },
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: raio.campo,
  },
  flexivel: { flex: 1 },
  primario: { backgroundColor: cores.primaria, ...sombraForte },
  secundario: { borderWidth: 1.5, borderColor: cores.primaria, backgroundColor: cores.superficie },
  perigo: { borderWidth: 1.5, borderColor: cores.erro, backgroundColor: cores.superficie },
  link: { minHeight: 44, paddingHorizontal: 8 },
  texto: { fontSize: 16, fontWeight: '700' },
  textoLink: { fontWeight: '600' },
});
