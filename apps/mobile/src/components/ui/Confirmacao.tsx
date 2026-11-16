import { Text, View } from 'react-native';

import { cores } from '../../theme/cores';
import { curva, raio } from '../../theme/estilo';
import { tamanho } from '../../theme/fontes';
import { Botao } from './Botao';
import { Icone } from './Icone';
import { criarEstilos } from '../../theme/tema';

type Props = {
  /** O que vai acontecer, em uma frase ("Rejeitar o cadastro de X?"). */
  pergunta: string;
  /** A consequência, para quem decide saber que não dá para voltar atrás. */
  detalhe?: string;
  /** Texto do botão que confirma ("Sim, rejeitar"). */
  confirmar: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  carregando?: boolean;
};

// Confirmação no próprio cartão, no lugar dos botões, para ações que apagam dados.
// Fica na tela em vez de um Alert porque o Alert do React Native não aparece na web.
export function Confirmacao({
  pergunta,
  detalhe,
  confirmar,
  onConfirmar,
  onCancelar,
  carregando = false,
}: Props) {
  const styles = useEstilos();
  return (
    <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.caixa}>
      <View style={styles.topo}>
        <Icone nome="alert-circle" cor={cores.erro} />
        <View style={styles.textos}>
          <Text style={styles.pergunta}>{pergunta}</Text>
          {detalhe ? <Text style={styles.detalhe}>{detalhe}</Text> : null}
        </View>
      </View>
      <View style={styles.acoes}>
        <Botao titulo="Cancelar" variante="secundario" flexivel onPress={onCancelar} />
        <Botao
          titulo={confirmar}
          variante="perigo"
          flexivel
          onPress={onConfirmar}
          carregando={carregando}
        />
      </View>
    </View>
  );
}

const useEstilos = criarEstilos(() => ({
  caixa: {
    gap: 12,
    padding: 14,
    borderRadius: raio.campo,
    ...curva,
    backgroundColor: cores.fundoErro,
  },
  topo: { flexDirection: 'row', gap: 10 },
  textos: { flex: 1, gap: 2 },
  pergunta: { fontSize: tamanho.corpo, fontWeight: '700', color: cores.texto },
  detalhe: { fontSize: tamanho.apoio, lineHeight: 19, color: cores.textoSecundario },
  acoes: { flexDirection: 'row', gap: 10 },
}));
