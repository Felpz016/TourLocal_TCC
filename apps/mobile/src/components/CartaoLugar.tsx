import { StyleSheet, Text, View } from 'react-native';

import type { Recomendacao } from '../api/recomendacoes';
import { cores } from '../theme/cores';

const PRECO = { economico: '$', moderado: '$$', alto: '$$$' } as const;

function formatarDistancia(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`;
}

function Selo({ texto, cor }: { texto: string; cor: string }) {
  return <Text style={[styles.selo, { color: cor, borderColor: cor }]}>{texto}</Text>;
}

export function CartaoLugar({ lugar }: { lugar: Recomendacao }) {
  const detalhes = [
    lugar.categorias.join(', '),
    lugar.faixa_preco ? PRECO[lugar.faixa_preco] : null,
    lugar.nota_media !== null ? `★ ${lugar.nota_media.toFixed(1).replace('.', ',')}` : null,
  ].filter(Boolean);

  return (
    <View
      style={styles.cartao}
      accessible
      accessibilityLabel={`${lugar.nome}, ${detalhes.join(', ')}`}
    >
      <View style={styles.topo}>
        <Text style={styles.nome} numberOfLines={2}>
          {lugar.nome}
        </Text>
        {lugar.aberto_agora === true ? <Selo texto="Aberto" cor={cores.primaria} /> : null}
        {lugar.aberto_agora === false ? <Selo texto="Fechado" cor={cores.erro} /> : null}
      </View>
      <Text style={styles.detalhes}>{detalhes.join(' · ')}</Text>
      {/* RF08: distância e tempo estimado de deslocamento. */}
      <Text style={styles.distancia}>
        {formatarDistancia(lugar.distancia_km)} · {lugar.minutos_a_pe} min a pé ·{' '}
        {lugar.minutos_de_carro} min de carro
      </Text>
      <Text style={styles.endereco} numberOfLines={1}>
        {lugar.endereco}
        {lugar.acessibilidade ? '  ♿' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E2E2',
    backgroundColor: cores.fundo,
    gap: 4,
  },
  topo: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  nome: { flex: 1, fontSize: 17, fontWeight: '700', color: cores.texto },
  selo: {
    fontSize: 12,
    fontWeight: '700',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  detalhes: { fontSize: 14, color: cores.textoSecundario },
  distancia: { fontSize: 14, color: cores.texto, fontWeight: '600' },
  endereco: { fontSize: 13, color: cores.textoSecundario },
});
