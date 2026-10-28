import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Recomendacao } from '../api/recomendacoes';
import { cores } from '../theme/cores';
import { raio, sombra } from '../theme/estilo';
import { PRECO, formatarDistancia, formatarNota } from '../util/formato';
import { Miniatura } from './Miniatura';
import { Icone } from './ui/Icone';

function Situacao({ aberto }: { aberto: boolean | null }) {
  if (aberto === null) return null;
  const cor = aberto ? '#047857' : cores.erro;
  return (
    <View style={styles.situacao}>
      <View style={[styles.ponto, { backgroundColor: cor }]} />
      <Text style={[styles.textoSituacao, { color: cor }]}>{aberto ? 'Aberto' : 'Fechado'}</Text>
    </View>
  );
}

export function CartaoLugar({ lugar }: { lugar: Recomendacao }) {
  const detalhes = [
    lugar.categorias.join(', '),
    lugar.faixa_preco ? PRECO[lugar.faixa_preco] : null,
  ].filter(Boolean);

  return (
    // Um toque no cartão abre os detalhes, de onde sai a rota (RNF03: até 3 toques).
    <Pressable
      style={({ pressed }) => [styles.cartao, pressed && styles.pressionado]}
      accessibilityRole="button"
      accessibilityLabel={`${lugar.nome}, ${detalhes.join(', ')}, ${formatarDistancia(lugar.distancia_km)}`}
      accessibilityHint="Abre os detalhes do local"
      onPress={() => router.push(`/lugar/${lugar.id_estab}`)}
    >
      <Miniatura foto={lugar.foto_url} eixo={lugar.eixo} />
      <View style={styles.info}>
        <View style={styles.topo}>
          <Text style={styles.nome} numberOfLines={2}>
            {lugar.nome}
          </Text>
          {lugar.nota_media !== null ? (
            <View style={styles.nota}>
              <Icone nome="star" tamanho={12} cor={cores.estrela} />
              <Text style={styles.textoNota}>{formatarNota(lugar.nota_media)}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.detalhes} numberOfLines={1}>
          {detalhes.join(' · ')}
          {lugar.acessibilidade ? '  ♿' : ''}
        </Text>
        {/* RF08: distância e tempo estimado de deslocamento. */}
        <View style={styles.distancia}>
          <Situacao aberto={lugar.aberto_agora} />
          <Icone nome="walk" tamanho={14} cor={cores.textoSecundario} />
          <Text style={styles.textoDistancia}>
            {formatarDistancia(lugar.distancia_km)} · {lugar.minutos_a_pe} min
          </Text>
          <Icone nome="car" tamanho={14} cor={cores.textoSecundario} />
          <Text style={styles.textoDistancia}>{lugar.minutos_de_carro} min</Text>
        </View>
        {/* RF11: por que este lugar foi recomendado (os dois motivos mais fortes). */}
        {lugar.motivos.length > 0 ? (
          <View style={styles.motivos}>
            {lugar.motivos.slice(0, 2).map((motivo) => (
              <Text key={motivo} style={styles.motivo} numberOfLines={1}>
                {motivo}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cartao: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: raio.cartao,
    backgroundColor: cores.superficie,
    ...sombra,
  },
  pressionado: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  info: { flex: 1, gap: 4 },
  topo: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  nome: { flex: 1, fontSize: 16, fontWeight: '700', color: cores.texto },
  nota: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: raio.pilula,
    backgroundColor: cores.fundoAlerta,
  },
  textoNota: { fontSize: 12, fontWeight: '700', color: cores.estrela },
  detalhes: { fontSize: 13, color: cores.textoSecundario },
  distancia: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  textoDistancia: { fontSize: 13, fontWeight: '600', color: cores.texto, marginRight: 4 },
  situacao: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 6 },
  ponto: { width: 7, height: 7, borderRadius: 4 },
  textoSituacao: { fontSize: 13, fontWeight: '700' },
  motivos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  motivo: {
    fontSize: 12,
    fontWeight: '600',
    color: cores.primariaEscura,
    backgroundColor: cores.fundoDestaque,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
    maxWidth: '100%',
  },
});
