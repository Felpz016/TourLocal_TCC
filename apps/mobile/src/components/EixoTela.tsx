import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { ApiError } from '../api/client';
import { buscarRecomendacoes } from '../api/recomendacoes';
import type { Eixo, Filtros, Recomendacoes } from '../api/recomendacoes';
import { useLocalizacao } from '../localizacao/LocalizacaoContext';
import { cores } from '../theme/cores';
import { curva, raio, sombraForte } from '../theme/estilo';
import { fonte, tamanho } from '../theme/fontes';
import { estilosLargura } from '../theme/layout';
import { vibrar } from '../util/vibracao';
import { BarraLocalizacao, PilulaLocalizacao } from './BarraLocalizacao';
import { CartaoLugar } from './CartaoLugar';
import { Mapa } from './Mapa';
import { Categorias, FolhaFiltros, contarFiltros, temFiltroAtivo } from './PainelFiltros';
import { Aviso } from './ui/Aviso';
import { Botao } from './ui/Botao';
import { Icone } from './ui/Icone';
import { Pressionavel } from './ui/Pressionavel';

type Props = { eixo: Eixo; vazio: string };

const TOPO: Record<Eixo, { titulo: string; subtitulo: string }> = {
  comer: { titulo: 'Onde comer', subtitulo: 'Restaurantes, cafés e bares perto de você' },
  ficar: { titulo: 'Onde ficar', subtitulo: 'Hotéis, pousadas e hostels por perto' },
  fazer: { titulo: 'O que fazer', subtitulo: 'Passeios, museus e parques perto de você' },
};

const km = (valor: number) => `${String(valor).replace('.', ',')} km`;

// As três alturas da lista, como a folha do Apple Maps: no meio (mapa em cima, lista
// embaixo), puxada para cima (só a lista) ou puxada para baixo (mapa em tela cheia, com
// só o título da lista aparecendo no rodapé).
type Detente = 'lista' | 'meio' | 'mapa';
const ORDEM: Detente[] = ['lista', 'meio', 'mapa'];
const ROTULO: Record<Detente, string> = {
  lista: 'lista em tela cheia',
  meio: 'mapa e lista',
  mapa: 'mapa em tela cheia',
};
// Mola das folhas do iOS: assenta em ~300 ms, carrega a velocidade do dedo e não passa do ponto.
const MOLA = { duration: 300, dampingRatio: 0.8, reduceMotion: ReduceMotion.System } as const;

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
      setErro(
        e instanceof ApiError
          ? e.message
          : 'Não foi possível carregar as recomendações. Puxe a tela para baixo para tentar de novo.',
      );
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

  // Altura da tela (sem a barra de abas) e do topo arrastável da lista, medidas no layout.
  const [altura, setAltura] = useState(0);
  const [alturaTopo, setAlturaTopo] = useState(110);
  const [detente, setDetente] = useState<Detente>('meio');
  const detenteAtual = useRef<Detente>('meio');

  // Posição (y) do topo da lista em cada altura.
  const yLista = top;
  const yMeio = ALTURA_MAPA + top - 28;
  const yMapa = Math.max(yMeio, altura - alturaTopo);
  const yDe = (d: Detente) => (d === 'lista' ? yLista : d === 'meio' ? yMeio : yMapa);

  // O topo da lista vive num valor compartilhado do Reanimated: o arrasto anda na thread de
  // interface, sem renderizar o React a cada quadro.
  const topoLista = useSharedValue(yMeio);
  const inicioArrasto = useSharedValue(0);

  const assentar = useCallback((d: Detente) => {
    if (d !== detenteAtual.current) vibrar.toque();
    detenteAtual.current = d;
    setDetente(d);
  }, []);

  function irPara(d: Detente) {
    topoLista.set(withSpring(yDe(d), MOLA));
    assentar(d);
  }

  // Quando a tela é medida (ou gira), a lista volta para o ponto certo da altura atual.
  useEffect(() => {
    if (altura) topoLista.set(yDe(detenteAtual.current));
  }, [altura, alturaTopo, top]);

  const arrasto = usePanGesture({
    // Só vale o arrasto na vertical; um movimento de lado é da rolagem dos chips.
    activeOffsetY: [-10, 10],
    failOffsetX: [-20, 20],
    onActivate: () => {
      'worklet';
      inicioArrasto.set(topoLista.get());
    },
    onUpdate: (e) => {
      'worklet';
      topoLista.set(Math.min(yMapa, Math.max(yLista, inicioArrasto.get() + e.translationY)));
    },
    onDeactivate: (e) => {
      'worklet';
      // Um movimento rápido já basta: projeta onde a lista pararia e escolhe a altura mais perto.
      const projetado = topoLista.get() + e.velocityY * 0.2;
      const alvos = [yLista, yMeio, yMapa];
      let indice = 0;
      for (let i = 1; i < alvos.length; i++) {
        if (Math.abs(alvos[i]! - projetado) < Math.abs(alvos[indice]! - projetado)) indice = i;
      }
      topoLista.set(withSpring(alvos[indice]!, { ...MOLA, velocity: e.velocityY }));
      scheduleOnRN(assentar, ORDEM[indice]!);
    },
  });

  const estiloLista = useAnimatedStyle(() => ({
    transform: [{ translateY: topoLista.get() - yLista }],
  }));

  // Parte do mapa coberta pela lista, para o centro do mapa ficar na área visível.
  const margemMapa = altura ? altura - Math.min(yDe(detente), altura) : 0;

  return (
    <View style={styles.tela} onLayout={(e) => setAltura(e.nativeEvent.layout.height)}>
      <StatusBar style="dark" />
      {/* O mapa ocupa a tela toda por trás; a lista desliza por cima e decide quanto dele aparece. */}
      <View style={StyleSheet.absoluteFill}>
        {posicao && altura ? (
          <Mapa
            posicao={posicao}
            lugares={resultados}
            altura={altura}
            margemInferior={margemMapa}
          />
        ) : (
          <View style={styles.semMapa}>
            <Icone nome="map-outline" tamanho={40} cor="rgba(255, 255, 255, 0.5)" />
          </View>
        )}
      </View>

      <View style={[styles.flutuantes, { top: top + 8 }]} pointerEvents="box-none">
        <PilulaLocalizacao />
        <View style={styles.botoesMapa}>
          <Pressionavel
            onPress={() => irPara(detente === 'mapa' ? 'meio' : 'mapa')}
            accessibilityRole="button"
            accessibilityLabel={
              detente === 'mapa' ? 'Voltar para a lista' : 'Ver mapa em tela cheia'
            }
            style={styles.botaoRedondo}
          >
            <Icone nome={detente === 'mapa' ? 'list' : 'expand'} tamanho={20} cor={cores.texto} />
          </Pressionavel>
          <Pressionavel
            onPress={() => setFiltrosAbertos(true)}
            accessibilityRole="button"
            accessibilityLabel={ativos ? `Filtros, ${ativos} ativos` : 'Filtros'}
            style={styles.botaoRedondo}
          >
            <Icone nome="options" tamanho={20} cor={cores.texto} />
            {ativos ? (
              <View style={styles.contador}>
                <Text style={styles.textoContador}>{ativos}</Text>
              </View>
            ) : null}
          </Pressionavel>
        </View>
      </View>

      <Animated.View
        style={[styles.folha, { top: yLista, height: Math.max(altura - yLista, 0) }, estiloLista]}
      >
        {/* Topo arrastável: puxar para baixo abre o mapa em tela cheia; para cima, a lista. */}
        <GestureDetector gesture={arrasto}>
          <View
            onLayout={(e) => setAlturaTopo(e.nativeEvent.layout.height)}
            style={[styles.topoFolha, estilosLargura.conteudo]}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={`${TOPO[eixo].titulo}, ${ROTULO[detente]}`}
            accessibilityHint="Deslize para cima ou para baixo com um dedo para mudar o tamanho do mapa"
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={(e) => {
              const i =
                ORDEM.indexOf(detente) + (e.nativeEvent.actionName === 'increment' ? -1 : 1);
              const d = ORDEM[i];
              if (d) irPara(d);
            }}
          >
            <Pressionavel
              escala={1}
              disabled={detente !== 'mapa'}
              onPress={() => irPara('meio')}
              importantForAccessibility="no"
              accessibilityElementsHidden
            >
              <View style={styles.alca} />
              <Text style={styles.titulo}>{TOPO[eixo].titulo}</Text>
              <Text style={styles.subtitulo}>
                {detente === 'mapa' && resultados.length > 0
                  ? `${resultados.length} ${resultados.length === 1 ? 'sugestão' : 'sugestões'} · toque para ver a lista`
                  : TOPO[eixo].subtitulo}
              </Text>
            </Pressionavel>
          </View>
        </GestureDetector>

        <ScrollView
          style={styles.rolagem}
          contentContainerStyle={[
            styles.conteudoLista,
            estilosLargura.conteudo,
            // No meio, o fim da lista fica abaixo da tela; o espaço extra deixa rolar até ele.
            { paddingBottom: 24 + (detente === 'lista' ? 0 : yMeio - yLista) },
          ]}
          refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregar} />}
        >
          <Categorias eixo={eixo} filtros={filtros} onChange={setFiltros} />

          <BarraLocalizacao />
          <Aviso texto={erro} />
          {carregando && !dados ? <ActivityIndicator color={cores.primaria} /> : null}

          {dados && resultados.length === 0 ? (
            // Exceção E1 do UC04: nada encontrado, sugere ampliar o raio ou limpar os filtros.
            <View style={styles.vazio}>
              <Text style={styles.tituloVazio}>Nenhum lugar por perto</Text>
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
        </ScrollView>
      </Animated.View>

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

const ALTURA_MAPA = 230;

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.tinta },
  semMapa: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  flutuantes: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  botoesMapa: { flexDirection: 'row', gap: 8 },
  botaoRedondo: {
    width: 44,
    height: 44,
    borderRadius: raio.pilula,
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
    borderRadius: raio.pilula,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.primaria,
  },
  textoContador: { fontSize: tamanho.mini, fontWeight: '800', color: cores.primariaTexto },
  folha: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopLeftRadius: raio.folha,
    borderTopRightRadius: raio.folha,
    ...curva,
    backgroundColor: cores.fundo,
    ...sombraForte,
  },
  // Área de arrasto: a alça, o título e o subtítulo, com folga embaixo para o dedo.
  topoFolha: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
  rolagem: { flex: 1 },
  conteudoLista: { gap: 10, paddingHorizontal: 20 },
  alca: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: raio.pilula,
    backgroundColor: cores.borda,
    marginBottom: 6,
  },
  titulo: {
    fontFamily: fonte.titulo,
    fontSize: tamanho.tela,
    color: cores.texto,
    letterSpacing: -0.5,
  },
  subtitulo: { fontSize: tamanho.corpo, color: cores.textoSecundario },
  cabecalhoLista: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 6,
  },
  contagem: { fontSize: tamanho.corpo, fontWeight: '600', color: cores.texto },
  raio: { fontSize: tamanho.rotulo, color: cores.textoSecundario },
  vazio: {
    gap: 10,
    padding: 20,
    borderRadius: raio.cartao,
    ...curva,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: cores.borda,
  },
  tituloVazio: { fontFamily: fonte.subtitulo, fontSize: tamanho.secao, color: cores.texto },
  textoVazio: { fontSize: tamanho.corpo, lineHeight: 21, color: cores.textoSecundario },
});
