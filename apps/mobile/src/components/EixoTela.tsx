import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ApiError } from '../api/client';
import { buscarRecomendacoes } from '../api/recomendacoes';
import type { Eixo, Filtros, Recomendacoes } from '../api/recomendacoes';
import { useLocalizacao } from '../localizacao/LocalizacaoContext';
import { cores } from '../theme/cores';
import { estilosLargura } from '../theme/layout';
import { BarraLocalizacao } from './BarraLocalizacao';
import { CartaoLugar } from './CartaoLugar';
import { Mapa } from './Mapa';
import { PainelFiltros, temFiltroAtivo } from './PainelFiltros';
import { Aviso } from './ui/Aviso';
import { Botao } from './ui/Botao';

type Props = { eixo: Eixo; vazio: string };

const km = (valor: number) => `${String(valor).replace('.', ',')} km`;

// Tela de cada eixo (UC04): posição, mapa, filtros e a lista ordenada pela pontuação.
export function EixoTela({ eixo, vazio }: Props) {
  const { posicao } = useLocalizacao();
  const [dados, setDados] = useState<Recomendacoes | null>(null);
  const [filtros, setFiltros] = useState<Filtros>({});
  // Raio ampliado pelo usuário quando não há resultados (exceção E1); null = raio do perfil.
  const [raioKm, setRaioKm] = useState<number | null>(null);
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
          raioKm,
          filtros,
        }),
      );
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar as recomendações.');
    } finally {
      setCarregando(false);
    }
  }, [eixo, posicao, raioKm, filtros]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const resultados = dados?.resultados ?? [];

  return (
    <ScrollView
      contentContainerStyle={[styles.conteudo, estilosLargura.conteudo]}
      refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregar} />}
    >
      <BarraLocalizacao />
      {posicao ? <Mapa posicao={posicao} lugares={resultados} /> : null}
      {posicao ? <PainelFiltros eixo={eixo} filtros={filtros} onChange={setFiltros} /> : null}

      <Aviso texto={erro} />
      {carregando && !dados ? <ActivityIndicator color={cores.primaria} /> : null}

      {dados && resultados.length === 0 ? (
        // Exceção E1 do UC04: nada encontrado, sugere ampliar o raio ou limpar os filtros.
        <View style={styles.vazio}>
          <Text style={styles.textoVazio}>
            {vazio} num raio de {km(dados.raio_km)}.
          </Text>
          {dados.raio_sugerido_km ? (
            <Botao
              titulo={`Buscar em até ${km(dados.raio_sugerido_km)}`}
              onPress={() => setRaioKm(dados.raio_sugerido_km)}
            />
          ) : null}
          {temFiltroAtivo(filtros) ? (
            <Botao titulo="Limpar filtros" variante="link" onPress={() => setFiltros({})} />
          ) : null}
        </View>
      ) : null}

      {resultados.length > 0 ? (
        <Text style={styles.contagem} accessibilityRole="header">
          {resultados.length} {resultados.length === 1 ? 'recomendação' : 'recomendações'} em até{' '}
          {km(dados!.raio_km)}
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
  contagem: { fontSize: 15, fontWeight: '700', color: cores.textoSecundario, marginTop: 4 },
  vazio: { paddingVertical: 16, gap: 8 },
  textoVazio: { fontSize: 16, color: cores.textoSecundario, textAlign: 'center' },
});
