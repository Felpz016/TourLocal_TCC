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

import { ApiError } from '../api/client';
import { buscarRecomendacoes } from '../api/recomendacoes';
import type { Eixo, Filtros, Recomendacoes } from '../api/recomendacoes';
import { useLocalizacao } from '../localizacao/LocalizacaoContext';
import { cores } from '../theme/cores';
import { raio } from '../theme/estilo';
import { estilosLargura } from '../theme/layout';
import { BarraLocalizacao, PilulaLocalizacao } from './BarraLocalizacao';
import { CartaoLugar } from './CartaoLugar';
import { Mapa } from './Mapa';
import { ICONE_EIXO } from './Miniatura';
import { Categorias, FolhaFiltros, contarFiltros, temFiltroAtivo } from './PainelFiltros';
import { Aviso } from './ui/Aviso';
import { Botao } from './ui/Botao';
import { Icone } from './ui/Icone';
import { TopoGradiente } from './ui/TopoGradiente';

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

  return (
    <View style={styles.tela}>
      <StatusBar style="light" />
      <TopoGradiente
        titulo={TOPO[eixo].titulo}
        subtitulo={TOPO[eixo].subtitulo}
        acima={
          <View style={styles.barraTopo}>
            <PilulaLocalizacao />
            <Pressable
              onPress={() => setFiltrosAbertos(true)}
              accessibilityRole="button"
              accessibilityLabel={ativos ? `Filtros, ${ativos} ativos` : 'Filtros'}
              style={({ pressed }) => [styles.botaoFiltros, pressed && { opacity: 0.8 }]}
            >
              <Icone nome="options" tamanho={20} cor={cores.primariaTexto} />
              {ativos ? (
                <View style={styles.contador}>
                  <Text style={styles.textoContador}>{ativos}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        }
      >
        <Categorias eixo={eixo} filtros={filtros} onChange={setFiltros} />
      </TopoGradiente>

      <ScrollView
        contentContainerStyle={[styles.conteudo, estilosLargura.conteudo]}
        refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregar} />}
      >
        <BarraLocalizacao />
        {posicao ? (
          <View style={styles.mapa}>
            <Mapa posicao={posicao} lugares={resultados} />
          </View>
        ) : null}

        <Aviso texto={erro} />
        {carregando && !dados ? <ActivityIndicator color={cores.primaria} /> : null}

        {dados && resultados.length === 0 ? (
          // Exceção E1 do UC04: nada encontrado, sugere ampliar o raio ou limpar os filtros.
          <View style={styles.vazio}>
            <View style={styles.iconeVazio}>
              <Icone nome={ICONE_EIXO[eixo]} tamanho={28} cor={cores.primaria} />
            </View>
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
              {resultados.length} {resultados.length === 1 ? 'lugar' : 'lugares'} para você
            </Text>
            <Text style={styles.raio}>até {km(dados!.raio_km)}</Text>
          </View>
        ) : null}
        {resultados.map((lugar) => (
          <CartaoLugar key={lugar.id_estab} lugar={lugar} />
        ))}
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

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  barraTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  botaoFiltros: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  contador: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
  },
  textoContador: { fontSize: 11, fontWeight: '800', color: cores.texto },
  conteudo: { padding: 20, gap: 14 },
  mapa: { borderRadius: raio.cartao, overflow: 'hidden' },
  cabecalhoLista: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 4,
  },
  contagem: { fontSize: 18, fontWeight: '800', color: cores.texto },
  raio: { fontSize: 14, color: cores.textoSecundario },
  vazio: {
    alignItems: 'stretch',
    gap: 12,
    padding: 20,
    borderRadius: raio.cartao,
    backgroundColor: cores.superficie,
  },
  iconeVazio: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.fundoDestaque,
  },
  textoVazio: { fontSize: 16, lineHeight: 22, color: cores.textoSecundario, textAlign: 'center' },
});
