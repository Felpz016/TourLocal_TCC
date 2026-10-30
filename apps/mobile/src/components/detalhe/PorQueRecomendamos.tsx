import { Text, View } from 'react-native';

import type { Recomendacao } from '../../api/recomendacoes';
import { cores } from '../../theme/cores';
import { curva, raio } from '../../theme/estilo';
import { fonte, tamanho } from '../../theme/fontes';
import { criarEstilos } from '../../theme/tema';
import { Icone } from '../ui/Icone';

const CRITERIOS: { chave: keyof Recomendacao['criterios']; rotulo: string }[] = [
  { chave: 'proximidade', rotulo: 'Perto de você' },
  { chave: 'avaliacao', rotulo: 'Avaliações' },
  { chave: 'orcamento', rotulo: 'Seu orçamento' },
  { chave: 'perfil', rotulo: 'Suas preferências' },
];

const porcentagem = (valor: number) => `${Math.round(valor * 100)}%`;

/**
 * RF11 e RN08 na tela: os motivos em texto e a nota de cada critério da pontuação, para o
 * turista entender por que o lugar apareceu (e a banca ver o algoritmo funcionando).
 */
export function PorQueRecomendamos({ recomendacao }: { recomendacao: Recomendacao }) {
  const styles = useEstilos();
  return (
    <View style={styles.bloco}>
      <Text style={styles.titulo} accessibilityRole="header">
        Por que recomendamos
      </Text>
      <View style={styles.caixa}>
        {recomendacao.motivos.map((motivo) => (
          <View key={motivo} style={styles.motivo}>
            <Icone nome="checkmark-circle" tamanho={18} cor={cores.sucesso} />
            <Text style={styles.textoMotivo}>{motivo}</Text>
          </View>
        ))}
        <View style={styles.criterios}>
          {CRITERIOS.map(({ chave, rotulo }) => {
            const valor = recomendacao.criterios[chave] ?? 0;
            return (
              <View
                key={chave}
                style={styles.criterio}
                accessible
                accessibilityLabel={`${rotulo}: ${porcentagem(valor)}`}
              >
                <View style={styles.linhaCriterio}>
                  <Text style={styles.rotulo}>{rotulo}</Text>
                  <Text style={styles.valor}>{porcentagem(valor)}</Text>
                </View>
                <View style={styles.trilho}>
                  <View style={[styles.barra, { width: porcentagem(valor) as `${number}%` }]} />
                </View>
              </View>
            );
          })}
        </View>
        <Text style={styles.nota}>
          Combinação de {porcentagem(recomendacao.pontuacao)} com o que você procura, somando
          distância, notas, preço e preferências.
        </Text>
      </View>
    </View>
  );
}

const useEstilos = criarEstilos(() => ({
  bloco: { gap: 10 },
  titulo: { fontFamily: fonte.subtitulo, fontSize: tamanho.secao, color: cores.texto },
  caixa: { gap: 10, padding: 14, borderRadius: raio.bloco, ...curva, backgroundColor: cores.fundo },
  motivo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  textoMotivo: { flex: 1, fontSize: tamanho.corpo, color: cores.texto },
  criterios: { gap: 10, marginTop: 4 },
  criterio: { gap: 4 },
  linhaCriterio: { flexDirection: 'row', justifyContent: 'space-between' },
  rotulo: { fontSize: tamanho.apoio, color: cores.textoSecundario },
  valor: { fontSize: tamanho.apoio, fontWeight: '600', color: cores.texto },
  trilho: { height: 6, borderRadius: raio.pilula, backgroundColor: cores.divisoria },
  barra: { height: 6, borderRadius: raio.pilula, backgroundColor: cores.primaria },
  nota: { fontSize: tamanho.legenda, lineHeight: 18, color: cores.textoSecundario },
}));
