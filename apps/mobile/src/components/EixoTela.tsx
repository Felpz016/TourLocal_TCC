import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '../api/client';
import { buscarRecomendacoes } from '../api/recomendacoes';
import type { Eixo, Filtros, Recomendacoes } from '../api/recomendacoes';
import { useLocalizacao } from '../localizacao/LocalizacaoContext';
import { cores } from '../theme/cores';
import { raio, sombraForte } from '../theme/estilo';
import { fonte } from '../theme/fontes';
import { estilosLargura } from '../theme/layout';
import { BarraLocalizacao, PilulaLocalizacao } from './BarraLocalizacao';
import { CartaoLugar } from './CartaoLugar';
import { Mapa } from './Mapa';
import { Categorias, FolhaFiltros, contarFiltros, temFiltroAtivo } from './PainelFiltros';
import { Aviso } from './ui/Aviso';
import { Botao } from './ui/Botao';
import { Icone } from './ui/Icone';

type Props = { eixo: Eixo; vazio: string };

const TOPO: Record<Eixo, { titulo: string; subtitulo: string }> = {
  comer: { titulo: 'Onde comer', subtitulo: 'Restaurantes, cafés e bares perto de você' },
  ficar: { titulo: 'Onde ficar', subtitulo: 'Hotéis, pousadas e hostels por perto' },
  fazer: { titulo: 'O que fazer', subtitulo: 'Passeios, museus e parques perto de você' },
};

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
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

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
  const ativos = contarFiltros(filtros);
  const { top } = useSafeAreaInsets();

  return (
    <View style={styles.tela}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregar} />}
      >
        {/* O mapa ocupa o topo, por trás da Dynamic Island, e a lista sobe por cima dele. */}
        <View style={[styles.mapa, { height: ALTURA_MAPA + top }]}>
          {posicao ? (
            <Mapa posicao={posicao} lugares={resultados} altura={ALTURA_MAPA + top} />
          ) : (
            <View style={styles.semMapa}>
              <Icone nome="map-outline" tamanho={40} cor="rgba(255, 255, 255, 0.5)" />
            </View>
          )}
          <View style={[styles.flutuantes, { top: top + 8 }]} pointerEvents="box-none">
            <PilulaLocalizacao />
            <Pressable
              onPress={() => setFiltrosAbertos(true)}
              accessibilityRole="button"
              accessibilityLabel={ativos ? `Filtros, ${ativos} ativos` : 'Filtros'}
              style={({ pressed }) => [styles.botaoFiltros, pressed && { opacity: 0.85 }]}
            >
              <Icone nome="options" tamanho={20} cor={cores.texto} />
              {ativos ? (
                <View style={styles.contador}>
                  <Text style={styles.textoContador}>{ativos}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </View>

        <View style={[styles.folha, estilosLargura.conteudo]}>
          <View style={styles.alca} />
          <Text style={styles.titulo} accessibilityRole="header">
            {TOPO[eixo].titulo}
          </Text>
          <Text style={styles.subtitulo}>{TOPO[eixo].subtitulo}</Text>
          <Categorias eixo={eixo} filtros={filtros} onChange={setFiltros} />

          <BarraLocalizacao />
          <Aviso texto={erro} />
          {carregando && !dados ? <ActivityIndicator color={cores.primaria} /> : null}

          {dados && resultados.length === 0 ? (
            // Exceção E1 do UC04: nada encontrado, sugere ampliar o raio ou limpar os filtros.
            <View style={styles.vazio}>
              <Text style={styles.tituloVazio}>Nada por aqui… ainda.</Text>
              <Text style={styles.textoVazio}>
                {vazio} num raio de {km(dados.raio_km)}.
              </Text>
              {dados.raio_sugerido_km ? (
                <Botao
                  titulo={`Buscar em até ${km(dados.raio_sugerido_km)}`}
                  icone="expand"
                  onPress={() => setRaioKm(dados.raio_sugerido_km)}
                />
              ) : null}
              {temFiltroAtivo(filtros) ? (
                <Botao titulo="Limpar filtros" variante="link" onPress={() => setFiltros({})} />
              ) : null}
            </View>
          ) : null}

          {resultados.length > 0 ? (
            <View style={styles.cabecalhoLista}>
              <Text style={styles.contagem} accessibilityRole="header">
                {resultados.length} {resultados.length === 1 ? 'sugestão' : 'sugestões'} para você
              </Text>
              <Text style={styles.raio}>até {km(dados!.raio_km)}</Text>
            </View>
          ) : null}
          {resultados.map((lugar) => (
            <CartaoLugar key={lugar.id_estab} lugar={lugar} />
          ))}
        </View>
      </ScrollView>

      <FolhaFiltros
        visivel={filtrosAbertos}
        filtros={filtros}
        total={dados ? resultados.length : null}
        onChange={setFiltros}
        onFechar={() => setFiltrosAbertos(false)}
      />
    </View>
  );
}

const ALTURA_MAPA = 250;

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  mapa: { backgroundColor: cores.tinta },
  semMapa: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  flutuantes: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  botaoFiltros: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.superficie,
    ...sombraForte,
  },
  contador: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.primaria,
  },
  textoContador: { fontSize: 11, fontWeight: '800', color: cores.primariaTexto },
  folha: {
    marginTop: -28,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 12,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: cores.fundo,
  },
  alca: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: cores.borda,
    marginBottom: 6,
  },
  titulo: { fontFamily: fonte.titulo, fontSize: 32, color: cores.texto, letterSpacing: -0.8 },
  subtitulo: { fontSize: 15, color: cores.textoSecundario, marginTop: -8 },
  cabecalhoLista: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 6,
  },
  contagem: { fontFamily: fonte.subtitulo, fontSize: 19, color: cores.texto },
  raio: { fontSize: 14, color: cores.textoSecundario },
  vazio: {
    gap: 10,
    padding: 20,
    borderRadius: raio.cartao,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: cores.borda,
  },
  tituloVazio: { fontFamily: fonte.subtitulo, fontSize: 20, color: cores.texto },
  textoVazio: { fontSize: 15, lineHeight: 21, color: cores.textoSecundario },
});
