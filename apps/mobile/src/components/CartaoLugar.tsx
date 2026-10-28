import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Recomendacao } from '../api/recomendacoes';
import { cores } from '../theme/cores';
import { raio, sombra } from '../theme/estilo';
import { fonte } from '../theme/fontes';
import { PRECO, formatarDistancia, formatarNota } from '../util/formato';
import { Miniatura } from './Miniatura';
import { Icone } from './ui/Icone';

export function CartaoLugar({ lugar }: { lugar: Recomendacao }) {
  const detalhes = [
    lugar.categorias.join(', '),
    lugar.faixa_preco ? PRECO[lugar.faixa_preco] : null,
  ].filter(Boolean);
  const aberto = lugar.aberto_agora;

  return (
    // Um toque no cartão abre os detalhes, de onde sai a rota (RNF03: até 3 toques).
    <Pressable
      style={({ pressed }) => [styles.cartao, pressed && styles.pressionado]}
      accessibilityRole="button"
      accessibilityLabel={`${lugar.nome}, ${detalhes.join(', ')}, ${lugar.minutos_a_pe} minutos a pé`}
      accessibilityHint="Abre os detalhes do local"
      onPress={() => router.push(`/lugar/${lugar.id_estab}`)}
    >
      <View style={styles.corpo}>
        <Miniatura nome={lugar.nome} foto={lugar.foto_url} />
        <View style={styles.info}>
          <Text style={styles.nome} numberOfLines={2}>
            {lugar.nome}
          </Text>
          <View style={styles.linha}>
            {lugar.nota_media !== null ? (
              <>
                <Icone nome="star" tamanho={12} cor={cores.estrela} />
                <Text style={styles.nota}>{formatarNota(lugar.nota_media)}</Text>
                <Text style={styles.detalhes}> · </Text>
              </>
            ) : null}
            <Text style={styles.detalhes} numberOfLines={1}>
              {detalhes.join(' · ')}
              {lugar.acessibilidade ? '  ♿' : ''}
            </Text>
          </View>
          {aberto !== null ? (
            <Text style={[styles.situacao, { color: aberto ? cores.sucesso : cores.erro }]}>
              {aberto ? 'Aberto agora' : 'Fechado agora'}
            </Text>
          ) : null}
          {/* RF11: o motivo mais forte da recomendação. */}
          {lugar.motivos[0] ? (
            <View style={styles.motivo}>
              <Icone nome="sparkles" tamanho={12} cor={cores.primaria} />
              <Text style={styles.textoMotivo} numberOfLines={1}>
                {lugar.motivos[0]}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* RF08: o tempo a pé em destaque, como num canhoto de bilhete. */}
      <View style={styles.canhoto}>
        {/* Recortes de bilhete no papel de fundo, em cima e embaixo do picote. */}
        <View style={[styles.recorte, { top: -9 }]} />
        <View style={[styles.recorte, { bottom: -9 }]} />
        <Text style={styles.minutos}>{lugar.minutos_a_pe}</Text>
        <Text style={styles.unidade}>min a pé</Text>
        <Text style={styles.metros}>{formatarDistancia(lugar.distancia_km)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cartao: {
    flexDirection: 'row',
    borderRadius: raio.cartao,
    backgroundColor: cores.superficie,
    ...sombra,
  },
  pressionado: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  corpo: { flex: 1, flexDirection: 'row', gap: 12, padding: 12 },
  info: { flex: 1, gap: 3, justifyContent: 'center' },
  nome: { fontFamily: fonte.subtitulo, fontSize: 17, lineHeight: 21, color: cores.texto },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  nota: { fontSize: 13, fontWeight: '700', color: cores.texto },
  detalhes: { flexShrink: 1, fontSize: 13, color: cores.textoSecundario },
  situacao: { fontSize: 13, fontWeight: '600' },
  motivo: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  textoMotivo: { flexShrink: 1, fontSize: 12, fontWeight: '600', color: cores.primaria },
  canhoto: {
    width: 74,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderLeftWidth: 1.5,
    borderLeftColor: cores.divisoria,
    borderStyle: 'dashed',
  },
  recorte: {
    position: 'absolute',
    left: -9,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: cores.fundo,
  },
  minutos: { fontFamily: fonte.titulo, fontSize: 28, lineHeight: 30, color: cores.primaria },
  unidade: { fontSize: 11, fontWeight: '700', color: cores.texto, textTransform: 'uppercase' },
  metros: { fontSize: 11, color: cores.textoSecundario, marginTop: 4 },
});
