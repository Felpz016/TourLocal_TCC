import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import type { Recomendacao } from '../api/recomendacoes';
import { cores } from '../theme/cores';
import { cartaoPlano, curva, raio } from '../theme/estilo';
import { fonte, tamanho } from '../theme/fontes';
import { PRECO, formatarDistancia, formatarNota } from '../util/formato';
import { Estrelas } from './detalhe/Estrelas';
import { Miniatura } from './Miniatura';
import { Icone } from './ui/Icone';
import { Pressionavel } from './ui/Pressionavel';

// Distância e nota já aparecem no cartão; o motivo mostrado é o próximo da lista.
const repetido = (motivo: string) => / a pé | km de você|^Bem avaliado/.test(motivo);

export function CartaoLugar({ lugar }: { lugar: Recomendacao }) {
  const detalhes = [
    lugar.categorias.join(', '),
    lugar.faixa_preco ? PRECO[lugar.faixa_preco] : null,
    formatarDistancia(lugar.distancia_km),
  ].filter(Boolean);
  const aberto = lugar.aberto_agora;
  const motivo = lugar.motivos.find((m) => !repetido(m));

  return (
    // Um toque no cartão abre os detalhes, de onde sai a rota (RNF03: até 3 toques).
    <Pressionavel
      style={({ pressed }) => [styles.cartao, pressed && styles.pressionado]}
      accessibilityRole="button"
      accessibilityLabel={`${lugar.nome}, ${detalhes.join(', ')}, ${lugar.minutos_a_pe} minutos a pé`}
      accessibilityHint="Abre os detalhes do local"
      onPress={() => router.push(`/lugar/${lugar.id_estab}`)}
    >
      <Miniatura nome={lugar.nome} foto={lugar.foto_url} tamanho={64} />
      <View style={styles.info}>
        <View style={styles.topo}>
          <Text style={styles.nome} numberOfLines={1}>
            {lugar.nome}
          </Text>
          {/* RF08: o tempo a pé fica sempre à vista, como no Citymapper. */}
          <View style={styles.ape}>
            <Icone nome="walk" tamanho={13} cor={cores.primariaEscura} />
            <Text style={styles.textoApe}>{lugar.minutos_a_pe} min</Text>
          </View>
        </View>

        {lugar.nota_media !== null ? (
          <View style={styles.linha}>
            <Text style={styles.nota}>{formatarNota(lugar.nota_media)}</Text>
            <Estrelas nota={Math.round(lugar.nota_media)} tamanho={11} />
            <Text style={styles.detalhes}>({lugar.total_avaliacoes})</Text>
          </View>
        ) : (
          <Text style={styles.detalhes}>Sem avaliações ainda</Text>
        )}

        <Text style={styles.detalhes} numberOfLines={1}>
          {detalhes.join(' · ')}
        </Text>

        <View style={styles.linha}>
          {aberto !== null ? (
            <Text style={[styles.situacao, { color: aberto ? cores.sucesso : cores.erro }]}>
              {aberto ? 'Aberto' : 'Fechado'}
            </Text>
          ) : null}
          {lugar.acessibilidade ? (
            <>
              {aberto !== null ? <Text style={styles.detalhes}>·</Text> : null}
              <Icone nome="accessibility" tamanho={13} cor={cores.textoSecundario} />
              <Text style={styles.detalhes}>Acessível</Text>
            </>
          ) : null}
        </View>

        {/* RF11: o motivo mais forte da recomendação que o cartão ainda não mostra. */}
        {motivo ? (
          <Text style={styles.motivo} numberOfLines={1}>
            {motivo}
          </Text>
        ) : null}
      </View>
    </Pressionavel>
  );
}

const styles = StyleSheet.create({
  cartao: {
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    borderRadius: raio.cartao,
    ...cartaoPlano,
  },
  pressionado: { backgroundColor: cores.fundoCampo },
  info: { flex: 1, gap: 3 },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nome: { flex: 1, fontFamily: fonte.subtitulo, fontSize: tamanho.destaque, color: cores.texto },
  ape: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: raio.pilula,
    backgroundColor: cores.fundoDestaque,
  },
  textoApe: { fontSize: tamanho.apoio, fontWeight: '700', color: cores.primariaEscura },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nota: { fontSize: tamanho.apoio, fontWeight: '600', color: cores.texto },
  detalhes: { flexShrink: 1, fontSize: tamanho.apoio, color: cores.textoSecundario },
  situacao: { fontSize: tamanho.apoio, fontWeight: '600' },
  motivo: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: raio.selo,
    ...curva,
    overflow: 'hidden',
    fontSize: tamanho.legenda,
    fontWeight: '600',
    color: cores.texto,
    backgroundColor: cores.fundo,
  },
});
