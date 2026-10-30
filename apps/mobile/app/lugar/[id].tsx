import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '../../src/api/client';
import { buscarDetalhe, definirFavorito } from '../../src/api/estabelecimentos';
import type { Detalhe, Horario } from '../../src/api/estabelecimentos';
import { urlFoto } from '../../src/api/gestao';
import { useAuth } from '../../src/auth/AuthContext';
import { PorQueRecomendamos } from '../../src/components/detalhe/PorQueRecomendamos';
import { SecaoAvaliacoes } from '../../src/components/detalhe/SecaoAvaliacoes';
import { Bloco, Pulsando } from '../../src/components/ui/Esqueleto';
import { Aviso } from '../../src/components/ui/Aviso';
import { Mapa } from '../../src/components/Mapa';
import { Icone } from '../../src/components/ui/Icone';
import type { NomeIcone } from '../../src/components/ui/Icone';
import { Pressionavel } from '../../src/components/ui/Pressionavel';
import { useLocalizacao } from '../../src/localizacao/LocalizacaoContext';
import { avisoOffline, guardar, ler, recomendacaoVista } from '../../src/offline/cache';
import { cores } from '../../src/theme/cores';
import { curva, raio, sombraForte } from '../../src/theme/estilo';
import { fonte, tamanho } from '../../src/theme/fontes';
import { LARGURA_MAXIMA, estilosLargura } from '../../src/theme/layout';
import { PRECO, formatarDistancia, formatarNota } from '../../src/util/formato';
import { compartilharLugar } from '../../src/util/compartilhar';
import { abrirRota } from '../../src/util/rota';
import { vibrar } from '../../src/util/vibracao';
import { criarEstilos, useTema } from '../../src/theme/tema';

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
// getDay() conta a partir do domingo; a API, a partir da segunda.
const hoje = () => (new Date().getDay() + 6) % 7;
const DIETAS: Record<string, string> = {
  vegetariano: 'Opção vegetariana',
  vegano: 'Opção vegana',
  sem_gluten: 'Opção sem glúten',
  sem_lactose: 'Opção sem lactose',
};

const hora = (h: string) => h.slice(0, 5);

function linhasDeHorario(horarios: Horario[]) {
  return DIAS.map((dia, indice) => {
    const doDia = horarios.filter((h) => h.dia_semana === indice);
    const texto = doDia.length
      ? doDia.map((h) => `${hora(h.hora_abertura)}–${hora(h.hora_fechamento)}`).join(', ')
      : 'Fechado';
    return { dia, texto, fechado: !doDia.length, hoje: indice === hoje() };
  });
}

const minutos = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));

/** Complemento do "Aberto"/"Fechado", como no Google Maps: quando fecha ou quando abre. */
function proximaMudanca(horarios: Horario[], aberto: boolean | null) {
  const agora = new Date();
  const atual = agora.getHours() * 60 + agora.getMinutes();
  const deHoje = horarios
    .filter((h) => h.dia_semana === hoje())
    .sort((a, b) => minutos(a.hora_abertura) - minutos(b.hora_abertura));
  if (aberto) {
    const turno = deHoje.find(
      (h) => minutos(h.hora_abertura) <= atual && atual < minutos(h.hora_fechamento),
    );
    return turno ? `Fecha às ${hora(turno.hora_fechamento)}` : null;
  }
  const proximo = deHoje.find((h) => minutos(h.hora_abertura) > atual);
  return proximo ? `Abre às ${hora(proximo.hora_abertura)}` : null;
}

function BotaoRedondo({
  icone,
  cor = cores.texto,
  rotulo,
  onPress,
  selecionado,
}: {
  icone: NomeIcone;
  cor?: string;
  rotulo: string;
  onPress: () => void;
  selecionado?: boolean;
}) {
  const styles = useEstilos();
  return (
    <Pressionavel
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={selecionado === undefined ? undefined : { selected: selecionado }}
      style={({ pressed }) => [styles.redondo, pressed && { opacity: 0.8 }]}
    >
      <Icone nome={icone} tamanho={22} cor={cor} />
    </Pressionavel>
  );
}

function Selo({
  texto,
  icone,
  tipo = 'normal',
}: {
  texto: string;
  icone?: NomeIcone;
  tipo?: 'normal' | 'alerta' | 'erro';
}) {
  const styles = useEstilos();
  const cor = tipo === 'erro' ? cores.erro : tipo === 'alerta' ? cores.alerta : cores.texto;
  const fundo =
    tipo === 'erro' ? cores.fundoErro : tipo === 'alerta' ? cores.fundoAlerta : cores.fundo;
  return (
    <View style={[styles.selo, { backgroundColor: fundo }]}>
      {icone ? (
        <Icone nome={icone} tamanho={14} cor={tipo === 'normal' ? cores.textoSecundario : cor} />
      ) : null}
      <Text style={[styles.textoSelo, { color: cor }]}>{texto}</Text>
    </View>
  );
}

// Detalhes do local (UC06, RF10): fotos, contato, horários, rota (RF12) e avaliações (RF13).
export default function LugarTela() {
  const styles = useEstilos();
  const { esquema } = useTema();
  const { id } = useLocalSearchParams<{ id: string }>();
  const idEstab = Number(id);
  const { usuario } = useAuth();
  const { posicao } = useLocalizacao();
  const [lugar, setLugar] = useState<Detalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [offline, setOffline] = useState<string | null>(null);
  const turista = usuario?.tipo === 'turista';
  const { top, bottom } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const larguraFoto = Math.min(width, LARGURA_MAXIMA);

  const carregar = useCallback(async () => {
    try {
      const detalhe = await buscarDetalhe(idEstab, posicao ?? undefined);
      setLugar(detalhe);
      setErro(null);
      setOffline(null);
      guardar(`lugar.${idEstab}`, detalhe);
    } catch (e) {
      // Sem rede: abre a última versão vista deste lugar, se houver.
      const guardado =
        e instanceof ApiError && e.status === 0 ? await ler<Detalhe>(`lugar.${idEstab}`) : null;
      if (guardado) {
        setLugar(guardado.dados);
        setOffline(avisoOffline(guardado.salvoEm));
        return;
      }
      setErro(
        e instanceof ApiError && e.status === 404
          ? 'Este local não está disponível.'
          : 'Não foi possível carregar o local. Volte e tente de novo.',
      );
    }
  }, [idEstab, posicao]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function alternarFavorito() {
    if (!lugar) return;
    const novo = !lugar.favorito;
    vibrar.toque();
    setLugar({ ...lugar, favorito: novo }); // muda na hora e desfaz se a API falhar
    try {
      await definirFavorito(lugar.id_estab, novo);
    } catch {
      setLugar((atual) => (atual ? { ...atual, favorito: !novo } : atual));
      setErro('Não foi possível salvar o local agora. Tente de novo.');
    }
  }

  if (!lugar) {
    return (
      <View style={[styles.centro, { paddingTop: top }]}>
        <View style={[styles.voltarSolto, { top: top + 8 }]}>
          <BotaoRedondo icone="chevron-back" rotulo="Voltar" onPress={() => router.back()} />
        </View>
        {erro ? (
          <Aviso texto={erro} />
        ) : (
          // Esqueleto no formato da tela: capa, nome, subtítulo e a linha de ações.
          <View style={[styles.esqueleto, { top: 0 }]}>
            <Pulsando>
              <Bloco altura={ALTURA_CAPA} style={styles.capaEsqueleto} />
              <View style={styles.linhasEsqueleto}>
                <Bloco largura="65%" altura={26} />
                <Bloco largura="45%" />
                <View style={styles.acoes}>
                  <Bloco largura="auto" altura={60} style={styles.acaoEsqueleto} />
                  <Bloco largura="auto" altura={60} style={styles.acaoEsqueleto} />
                  <Bloco largura="auto" altura={60} style={styles.acaoEsqueleto} />
                </View>
                <Bloco altura={64} />
              </View>
            </Pulsando>
          </View>
        )}
      </View>
    );
  }

  const temFotos = lugar.fotos.length > 0;
  const mudanca = proximaMudanca(lugar.horarios, lugar.aberto_agora);
  const subtitulo = [
    lugar.categorias.join(', ') || 'Local',
    lugar.faixa_preco ? PRECO[lugar.faixa_preco] : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.tela}>
      <StatusBar style={temFotos || esquema === 'escuro' ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={{ paddingBottom: bottom + 32 }}>
        {/* Fotos em tela cheia; sem fotos, o mapa do lugar como capa (igual ao Apple Maps). */}
        <View style={[styles.capa, estilosLargura.conteudo]}>
          {temFotos ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {lugar.fotos.map((foto) => (
                <Image
                  key={foto.url}
                  source={{ uri: urlFoto(foto.url) }}
                  style={[styles.foto, { width: larguraFoto }]}
                  accessibilityLabel={foto.legenda ?? `Foto de ${lugar.nome}`}
                />
              ))}
            </ScrollView>
          ) : (
            <Mapa
              altura={ALTURA_CAPA}
              destaque={{ latitude: lugar.latitude, longitude: lugar.longitude, nome: lugar.nome }}
            />
          )}
          <View style={[styles.botoesCapa, { top: top + 8 }]} pointerEvents="box-none">
            <BotaoRedondo icone="chevron-back" rotulo="Voltar" onPress={() => router.back()} />
            <View style={styles.botoesDireita}>
              <BotaoRedondo
                icone="share-outline"
                rotulo="Compartilhar"
                onPress={() => compartilharLugar(lugar)}
              />
              {turista ? (
                <BotaoRedondo
                  icone={lugar.favorito ? 'heart' : 'heart-outline'}
                  cor={lugar.favorito ? cores.favorito : cores.texto}
                  rotulo={lugar.favorito ? 'Remover dos salvos' : 'Salvar local'}
                  selecionado={lugar.favorito}
                  onPress={alternarFavorito}
                />
              ) : lugar.pode_editar ? (
                <BotaoRedondo
                  icone="create-outline"
                  rotulo="Editar local"
                  onPress={() => router.push(`/gestao/${lugar.id_estab}`)}
                />
              ) : null}
            </View>
          </View>
        </View>

        <View style={[styles.folha, estilosLargura.conteudo]}>
          <View style={styles.cabecalho}>
            <Text style={styles.nome} accessibilityRole="header">
              {lugar.nome}
            </Text>
            <Text style={styles.subtitulo}>{subtitulo}</Text>
            {lugar.fechado_temporariamente ? (
              <Text style={[styles.situacao, { color: cores.erro }]}>Fechado temporariamente</Text>
            ) : lugar.aberto_agora !== null ? (
              <Text style={styles.subtitulo}>
                <Text
                  style={[
                    styles.situacao,
                    { color: lugar.aberto_agora ? cores.sucesso : cores.erro },
                  ]}
                >
                  {lugar.aberto_agora ? 'Aberto' : 'Fechado'}
                </Text>
                {mudanca ? ` · ${mudanca}` : ''}
              </Text>
            ) : null}
            {!lugar.verificado ? (
              <View style={styles.selos}>
                <Selo texto="Aguardando verificação" icone="time-outline" tipo="alerta" />
              </View>
            ) : null}
          </View>

          {/* RF12: a rota abre no app de mapas; ligar, site e compartilhar ficam ao lado. */}
          <View style={styles.acoes}>
            <BotaoAcao
              icone="navigate"
              titulo="Rotas"
              principal
              onPress={() =>
                abrirRota({
                  latitude: lugar.latitude,
                  longitude: lugar.longitude,
                  nome: lugar.nome,
                })
              }
            />
            {lugar.telefone ? (
              <BotaoAcao
                icone="call"
                titulo="Ligar"
                onPress={() => Linking.openURL(`tel:${lugar.telefone!.replace(/[^\d+]/g, '')}`)}
              />
            ) : null}
            {lugar.site ? (
              <BotaoAcao icone="globe" titulo="Site" onPress={() => Linking.openURL(lugar.site!)} />
            ) : null}
            <BotaoAcao
              icone="share-outline"
              titulo="Enviar"
              rotulo="Enviar para alguém"
              onPress={() => compartilharLugar(lugar)}
            />
          </View>

          {/* Resumo em colunas, como o cabeçalho de lugar do Apple Maps. */}
          <View style={styles.resumo}>
            <ColunaResumo
              rotulo={
                lugar.total_avaliacoes === 1
                  ? '1 avaliação'
                  : `${lugar.total_avaliacoes} avaliações`
              }
              valor={lugar.nota_media !== null ? formatarNota(lugar.nota_media) : '—'}
              icone={lugar.nota_media !== null ? 'star' : undefined}
            />
            <View style={styles.separador} />
            <ColunaResumo
              rotulo="Distância"
              valor={lugar.distancia_km !== null ? formatarDistancia(lugar.distancia_km) : '—'}
            />
            <View style={styles.separador} />
            <ColunaResumo
              rotulo="Preço"
              valor={lugar.faixa_preco ? PRECO[lugar.faixa_preco] : '—'}
            />
          </View>

          <Aviso texto={erro} />
          <Aviso texto={offline} tipo="alerta" />

          {lugar.acessibilidade || lugar.opcoes_alimentares.length > 0 ? (
            <View style={styles.selos}>
              {lugar.acessibilidade ? <Selo texto="Acessível" icone="accessibility" /> : null}
              {lugar.opcoes_alimentares.map((o) => (
                <Selo key={o} texto={DIETAS[o] ?? o} icone="leaf-outline" />
              ))}
            </View>
          ) : null}

          {/* RF11: aparece quando o turista chegou aqui pela lista de recomendações. */}
          {recomendacaoVista(lugar.id_estab) ? (
            <PorQueRecomendamos recomendacao={recomendacaoVista(lugar.id_estab)!} />
          ) : null}

          {lugar.descricao ? (
            <View style={styles.bloco}>
              <Text style={styles.titulo} accessibilityRole="header">
                Sobre
              </Text>
              <Text style={styles.texto}>{lugar.descricao}</Text>
            </View>
          ) : null}

          <View style={styles.bloco}>
            <Text style={styles.titulo} accessibilityRole="header">
              Informações
            </Text>
            <View style={styles.lista}>
              <LinhaInfo
                icone="location-outline"
                titulo="Endereço"
                valor={lugar.endereco}
                onPress={() =>
                  abrirRota({
                    latitude: lugar.latitude,
                    longitude: lugar.longitude,
                    nome: lugar.nome,
                  })
                }
              />
              {lugar.telefone ? (
                <LinhaInfo
                  icone="call-outline"
                  separada
                  titulo="Telefone"
                  valor={lugar.telefone}
                  onPress={() => Linking.openURL(`tel:${lugar.telefone!.replace(/[^\d+]/g, '')}`)}
                />
              ) : null}
              {lugar.site ? (
                <LinhaInfo
                  icone="globe-outline"
                  separada
                  titulo="Site"
                  valor={lugar.site.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                  onPress={() => Linking.openURL(lugar.site!)}
                />
              ) : null}
            </View>
          </View>

          {lugar.horarios.length > 0 ? (
            <View style={styles.bloco}>
              <Text style={styles.titulo} accessibilityRole="header">
                Horários
              </Text>
              <View style={styles.lista}>
                {linhasDeHorario(lugar.horarios).map((l, i) => (
                  <View key={l.dia} style={[styles.linhaHorario, i > 0 && styles.divisoria]}>
                    <Text style={[styles.dia, l.hoje && styles.hoje]}>
                      {l.dia}
                      {l.hoje ? ' (hoje)' : ''}
                    </Text>
                    <Text
                      style={[
                        styles.dia,
                        l.hoje && styles.hoje,
                        l.fechado && { color: cores.textoSecundario },
                      ]}
                    >
                      {l.texto}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <SecaoAvaliacoes
            key={lugar.minha_avaliacao?.id_avaliacao ?? 'nova'}
            lugar={lugar}
            podeAvaliar={turista}
            aoMudar={carregar}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function ColunaResumo({
  rotulo,
  valor,
  icone,
}: {
  rotulo: string;
  valor: string;
  icone?: NomeIcone;
}) {
  const styles = useEstilos();
  return (
    <View style={styles.coluna} accessible accessibilityLabel={`${rotulo}: ${valor}`}>
      <Text style={styles.rotuloResumo}>{rotulo}</Text>
      <View style={styles.valorLinha}>
        {icone ? <Icone nome={icone} tamanho={15} cor={cores.estrela} /> : null}
        <Text style={styles.valorResumo}>{valor}</Text>
      </View>
    </View>
  );
}

function BotaoAcao({
  icone,
  titulo,
  rotulo,
  principal,
  onPress,
}: {
  icone: NomeIcone;
  titulo: string;
  /** Nome lido pelo leitor de tela, quando o título curto não basta. */
  rotulo?: string;
  principal?: boolean;
  onPress: () => void;
}) {
  const styles = useEstilos();
  const cor = principal ? cores.primariaTexto : cores.primaria;
  return (
    <Pressionavel
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo ?? titulo}
      style={({ pressed }) => [
        styles.botaoAcao,
        principal && styles.botaoPrincipal,
        pressed && { opacity: 0.75 },
      ]}
    >
      <Icone nome={icone} tamanho={20} cor={cor} />
      <Text style={[styles.textoAcao, { color: cor }]}>{titulo}</Text>
    </Pressionavel>
  );
}

function LinhaInfo({
  icone,
  titulo,
  valor,
  separada,
  onPress,
}: {
  icone: NomeIcone;
  titulo: string;
  valor: string;
  separada?: boolean;
  onPress?: () => void;
}) {
  const styles = useEstilos();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [
        styles.linhaInfo,
        separada && styles.divisoria,
        pressed && { opacity: 0.6 },
      ]}
    >
      <View style={styles.textosInfo}>
        <Text style={styles.rotuloInfo}>{titulo}</Text>
        <Text style={[styles.valorInfo, onPress && { color: cores.primaria }]}>{valor}</Text>
      </View>
      <Icone nome={icone} tamanho={20} cor={cores.primaria} />
    </Pressable>
  );
}

const ALTURA_CAPA = 280;

const useEstilos = criarEstilos(() => ({
  tela: { flex: 1, backgroundColor: cores.superficie },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: cores.fundo,
  },
  voltarSolto: { position: 'absolute', left: 16, zIndex: 1 },
  esqueleto: { position: 'absolute', left: 0, right: 0 },
  capaEsqueleto: { borderRadius: 0 },
  linhasEsqueleto: { gap: 12, padding: 20 },
  acaoEsqueleto: { flex: 1, borderRadius: raio.bloco },
  botoesDireita: { flexDirection: 'row', gap: 10 },
  capa: { height: ALTURA_CAPA, backgroundColor: cores.fundoDestaque },
  foto: { height: ALTURA_CAPA },
  botoesCapa: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  redondo: {
    width: 40,
    height: 40,
    borderRadius: raio.pilula,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.superficie,
    ...sombraForte,
  },
  folha: {
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 22,
    gap: 20,
    borderTopLeftRadius: raio.cartao,
    borderTopRightRadius: raio.cartao,
    ...curva,
    backgroundColor: cores.superficie,
  },
  cabecalho: { gap: 4 },
  bloco: { gap: 10 },
  nome: {
    fontFamily: fonte.titulo,
    fontSize: tamanho.tela,
    lineHeight: 32,
    color: cores.texto,
    letterSpacing: -0.5,
  },
  subtitulo: { fontSize: tamanho.corpo, color: cores.textoSecundario },
  situacao: { fontSize: tamanho.corpo, fontWeight: '600' },
  titulo: { fontFamily: fonte.subtitulo, fontSize: tamanho.secao, color: cores.texto },
  texto: { fontSize: tamanho.corpo, lineHeight: 22, color: cores.texto },
  selos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: raio.selo,
    ...curva,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  textoSelo: { fontSize: tamanho.apoio, fontWeight: '500' },
  acoes: { flexDirection: 'row', gap: 8 },
  botaoAcao: {
    flex: 1,
    height: 60,
    gap: 4,
    borderRadius: raio.bloco,
    ...curva,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.fundoDestaque,
  },
  botaoPrincipal: { backgroundColor: cores.primaria },
  textoAcao: { fontSize: tamanho.legenda, fontWeight: '600' },
  resumo: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: cores.linha,
  },
  coluna: { flex: 1, gap: 4, paddingHorizontal: 4 },
  separador: { width: StyleSheet.hairlineWidth, backgroundColor: cores.linha, marginRight: 12 },
  rotuloResumo: {
    fontSize: tamanho.mini,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: cores.textoSecundario,
  },
  valorLinha: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  valorResumo: { fontSize: tamanho.cabecalho, fontWeight: '700', color: cores.texto },
  lista: {
    borderRadius: raio.bloco,
    ...curva,
    paddingHorizontal: 14,
    backgroundColor: cores.fundo,
  },
  linhaInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  textosInfo: { flex: 1, gap: 2 },
  rotuloInfo: { fontSize: tamanho.apoio, color: cores.textoSecundario },
  valorInfo: { fontSize: tamanho.corpo, color: cores.texto },
  linhaHorario: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11 },
  divisoria: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: cores.linha },
  dia: { fontSize: tamanho.corpo, color: cores.texto },
  hoje: { fontWeight: '700', color: cores.primaria },
}));
