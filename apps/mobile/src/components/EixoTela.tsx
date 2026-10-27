import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { ApiError } from '../api/client';
import { buscarRecomendacoes } from '../api/recomendacoes';
import type { Eixo, Recomendacoes } from '../api/recomendacoes';
import { useLocalizacao } from '../localizacao/LocalizacaoContext';
import { cores } from '../theme/cores';
import { BarraLocalizacao } from './BarraLocalizacao';
import { CartaoLugar } from './CartaoLugar';
import { Mapa } from './Mapa';
import { Aviso } from './ui/Aviso';

type Props = { eixo: Eixo; vazio: string };

// Tela de cada eixo (UC04): posição, mapa e a lista do mais perto ao mais longe.
export function EixoTela({ eixo, vazio }: Props) {
  const { posicao } = useLocalizacao();
  const [dados, setDados] = useState<Recomendacoes | null>(null);
  const [incluirFechados, setIncluirFechados] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!posicao) return;
    setCarregando(true);
    setErro(null);
    try {
      setDados(
        await buscarRecomendacoes({
          eixo,
          lat: posicao.latitude,
          lng: posicao.longitude,
          incluirFechados,
        }),
      );
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar as recomendações.');
    } finally {
      setCarregando(false);
    }
  }, [eixo, posicao, incluirFechados]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const resultados = dados?.resultados ?? [];

  return (
    <ScrollView
      contentContainerStyle={styles.conteudo}
      refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregar} />}
    >
      <BarraLocalizacao />
      {posicao ? <Mapa posicao={posicao} lugares={resultados} /> : null}

      {posicao ? (
        <View style={styles.filtro}>
          <Text style={styles.textoFiltro}>Mostrar também os fechados agora</Text>
          <Switch
            accessibilityLabel="Mostrar também os fechados agora"
            value={incluirFechados}
            onValueChange={setIncluirFechados}
            trackColor={{ true: cores.primaria }}
          />
        </View>
      ) : null}

      <Aviso texto={erro} />
      {carregando && !dados ? <ActivityIndicator color={cores.primaria} /> : null}

      {dados && resultados.length === 0 ? (
        <Text style={styles.vazio}>
          {vazio} num raio de {String(dados.raio_km).replace('.', ',')} km.
        </Text>
      ) : null}

      {resultados.length > 0 ? (
        <Text style={styles.contagem} accessibilityRole="header">
          {resultados.length} {resultados.length === 1 ? 'lugar' : 'lugares'} em até{' '}
          {String(dados!.raio_km).replace('.', ',')} km
        </Text>
      ) : null}
      {resultados.map((lugar) => (
        <CartaoLugar key={lugar.id_estab} lugar={lugar} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: { padding: 16, gap: 12 },
  filtro: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  textoFiltro: { fontSize: 15, color: cores.texto },
  contagem: { fontSize: 15, fontWeight: '700', color: cores.textoSecundario, marginTop: 4 },
  vazio: { fontSize: 16, color: cores.textoSecundario, textAlign: 'center', paddingVertical: 24 },
});
