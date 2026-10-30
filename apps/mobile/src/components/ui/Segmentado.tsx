import { Pressable, Text, View } from 'react-native';

import { cores } from '../../theme/cores';
import { curva, raio, sombra } from '../../theme/estilo';
import { tamanho } from '../../theme/fontes';
import { criarEstilos } from '../../theme/tema';
import { vibrar } from '../../util/vibracao';
import { Icone } from './Icone';
import type { NomeIcone } from './Icone';

type Opcao<T extends string> = { valor: T; rotulo: string; icone?: NomeIcone };

type Props<T extends string> = {
  opcoes: readonly Opcao<T>[];
  valor: T;
  onChange: (valor: T) => void;
  /** "abas" troca o conteúdo da tela (Moderação); "opcoes" é uma escolha única (Aparência). */
  papel?: 'abas' | 'opcoes';
};

/** Controle segmentado do iOS: um trilho com a opção escolhida em destaque, como um botão. */
export function Segmentado<T extends string>({
  opcoes,
  valor,
  onChange,
  papel = 'opcoes',
}: Props<T>) {
  const styles = useEstilos();
  return (
    <View style={styles.trilho} accessibilityRole={papel === 'abas' ? 'tablist' : 'radiogroup'}>
      {opcoes.map((o) => {
        const ativa = o.valor === valor;
        const cor = ativa ? cores.texto : cores.textoSecundario;
        return (
          <Pressable
            key={o.valor}
            onPress={() => {
              if (!ativa) vibrar.selecao();
              onChange(o.valor);
            }}
            accessibilityRole={papel === 'abas' ? 'tab' : 'radio'}
            accessibilityState={papel === 'abas' ? { selected: ativa } : { checked: ativa }}
            accessibilityLabel={o.rotulo}
            // Com ícone, ele fica em cima do nome, como o seletor de aparência do iOS.
            style={[styles.segmento, o.icone && styles.comIcone, ativa && styles.ativo]}
          >
            {o.icone ? <Icone nome={o.icone} tamanho={20} cor={cor} /> : null}
            <Text style={[styles.texto, ativa && styles.textoAtivo]} numberOfLines={1}>
              {o.rotulo}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useEstilos = criarEstilos(() => ({
  trilho: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: raio.campo,
    ...curva,
    backgroundColor: cores.divisoria,
  },
  segmento: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: raio.icone,
    ...curva,
  },
  comIcone: { flexDirection: 'column', gap: 2, minHeight: 56, paddingVertical: 6 },
  ativo: { backgroundColor: cores.superficie, ...sombra },
  texto: { fontSize: tamanho.rotulo, fontWeight: '600', color: cores.textoSecundario },
  textoAtivo: { color: cores.texto, fontWeight: '700' },
}));
