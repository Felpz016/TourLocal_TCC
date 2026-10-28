import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { SecaoAvaliacoes } from '../../src/components/detalhe/SecaoAvaliacoes';
import { Aviso } from '../../src/components/ui/Aviso';
import { inicial } from '../../src/components/Miniatura';
import { Botao } from '../../src/components/ui/Botao';
import { Icone } from '../../src/components/ui/Icone';
import type { NomeIcone } from '../../src/components/ui/Icone';
import { useLocalizacao } from '../../src/localizacao/LocalizacaoContext';
import { corDoLugar, cores } from '../../src/theme/cores';
import { fonte } from '../../src/theme/fontes';
import { raio } from '../../src/theme/estilo';
import { LARGURA_MAXIMA, estilosLargura } from '../../src/theme/layout';
import { PRECO, formatarDistancia, formatarNota } from '../../src/util/formato';
import { abrirRota } from '../../src/util/rota';

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
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={selecionado === undefined ? undefined : { selected: selecionado }}
      style={({ pressed }) => [styles.redondo, pressed && { opacity: 0.8 }]}
    >
      <Icone nome={icone} tamanho={22} cor={cor} />
    </Pressable>
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
  const cor =
    tipo === 'erro' ? cores.erro : tipo === 'alerta' ? cores.alerta : cores.primariaEscura;
  const fundo =
    tipo === 'erro' ? cores.fundoErro : tipo === 'alerta' ? cores.fundoAlerta : cores.fundoDestaque;
  return (
    <View style={[styles.selo, { backgroundColor: fundo }]}>
      {icone ? <Icone nome={icone} tamanho={13} cor={cor} /> : null}
      <Text style={[styles.textoSelo, { color: cor }]}>{texto}</Text>
    </View>
  );
}

// Detalhes do local (UC06, RF10): fotos, contato, horários, rota (RF12) e avaliações (RF13).
export default function LugarTela() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const idEstab = Number(id);
  const { usuario } = useAuth();
  const { posicao } = useLocalizacao();
  const [lugar, setLugar] = useState<Detalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const turista = usuario?.tipo === 'turista';
  const { top, bottom } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const larguraFoto = Math.min(width, LARGURA_MAXIMA);

  const carregar = useCallback(async () => {
    try {
      setLugar(await buscarDetalhe(idEstab, posicao ?? undefined));
      setErro(null);
    } catch (e) {
      setErro(
        e instanceof ApiError && e.status === 404
          ? 'Este local não está disponível.'
          : 'Não foi possível carregar o local.',
      );
    }
  }, [idEstab, posicao]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function alternarFavorito() {
    if (!lugar) return;
    const novo = !lugar.favorito;
    setLugar({ ...lugar, favorito: novo }); // muda na hora e desfaz se a API falhar
    try {
      await definirFavorito(lugar.id_estab, novo);
    } catch {
      setLugar((atual) => (atual ? { ...atual, favorito: !novo } : atual));
      setErro('Não foi possível atualizar os salvos.');
    }
  }

  if (!lugar) {
    return (
      <View style={[styles.centro, { paddingTop: top }]}>
        <View style={[styles.voltarSolto, { top: top + 8 }]}>
          <BotaoRedondo icone="chevron-back" rotulo="Voltar" onPress={() => router.back()} />
        </View>
        {erro ? <Aviso texto={erro} /> : <ActivityIndicator color={cores.primaria} />}
      </View>
    );
  }

  const hojeTexto = linhasDeHorario(lugar.horarios).find((h) => h.hoje);

  return (
    <View style={styles.tela}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: bottom + 32 }}>
        {/* Fotos em tela cheia; sem fotos, um degradê azul com o ícone do eixo. */}
        <View style={[styles.capa, estilosLargura.conteudo]}>
          {lugar.fotos.length > 0 ? (
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
            <View style={[styles.semFoto, { backgroundColor: corDoLugar(lugar.nome) }]}>
              <Text style={styles.letraCapa}>{inicial(lugar.nome)}</Text>
            </View>
          )}
          <View style={[styles.botoesCapa, { top: top + 8 }]}>
            <BotaoRedondo icone="chevron-back" rotulo="Voltar" onPress={() => router.back()} />
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

        <View style={[styles.folha, estilosLargura.conteudo]}>
          <View style={styles.bloco}>
            <Text style={styles.sobretitulo}>{lugar.categorias.join(' · ') || 'Local'}</Text>
            <Text style={styles.nome} accessibilityRole="header">
              {lugar.nome}
            </Text>
            <View style={styles.selos}>
              {lugar.aberto_agora === true ? (
                <Selo texto="Aberto agora" icone="time-outline" />
              ) : null}
              {!lugar.verificado ? <Selo texto="Aguardando verificação" tipo="alerta" /> : null}
              {lugar.fechado_temporariamente ? (
                <Selo texto="Fechado temporariamente" tipo="erro" />
              ) : null}
              {lugar.aberto_agora === false && !lugar.fechado_temporariamente ? (
                <Selo texto="Fechado agora" tipo="erro" />
              ) : null}
              {lugar.acessibilidade ? <Selo texto="Acessível" icone="accessibility" /> : null}
              {lugar.opcoes_alimentares.map((o) => (
                <Selo key={o} texto={DIETAS[o] ?? o} icone="leaf-outline" />
              ))}
            </View>
          </View>

          {/* Resumo em formato de bilhete: nota, distância e preço. */}
          <View style={styles.bilhete}>
            <View style={[styles.recorte, { left: -10 }]} />
            <View style={[styles.recorte, { right: -10 }]} />
            <ColunaBilhete
              valor={lugar.nota_media !== null ? `★ ${formatarNota(lugar.nota_media)}` : '—'}
              rotulo={
                lugar.total_avaliacoes === 1
                  ? '1 avaliação'
                  : `${lugar.total_avaliacoes} avaliações`
              }
            />
            <View style={styles.picote} />
            <ColunaBilhete
              valor={lugar.distancia_km !== null ? formatarDistancia(lugar.distancia_km) : '—'}
              rotulo="de você"
            />
            <View style={styles.picote} />
            <ColunaBilhete
              valor={lugar.faixa_preco ? PRECO[lugar.faixa_preco] : '—'}
              rotulo="preço"
            />
          </View>

          <Aviso texto={erro} />

          {/* RF12: a rota abre no app de mapas; ligar e site ficam ao lado. */}
          <View style={styles.acoes}>
            <Botao
              titulo="Como chegar"
              icone="navigate"
              flexivel
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
                icone="call-outline"
                rotulo={`Ligar para ${lugar.telefone}`}
                onPress={() => Linking.openURL(`tel:${lugar.telefone!.replace(/[^\d+]/g, '')}`)}
              />
            ) : null}
            {lugar.site ? (
              <BotaoAcao
                icone="globe-outline"
                rotulo="Abrir site"
                onPress={() => Linking.openURL(lugar.site!)}
              />
            ) : null}
          </View>

          <View style={styles.info}>
            <LinhaInfo
              icone="location-outline"
              titulo={lugar.endereco}
              detalhe={
                lugar.distancia_km !== null
                  ? `${formatarDistancia(lugar.distancia_km)} de você`
                  : undefined
              }
            />
            {lugar.telefone ? <LinhaInfo icone="call-outline" titulo={lugar.telefone} /> : null}
            {hojeTexto && lugar.horarios.length > 0 ? (
              <LinhaInfo icone="time-outline" titulo={`Hoje: ${hojeTexto.texto}`} />
            ) : null}
          </View>

          {lugar.descricao ? (
            <View style={styles.bloco}>
              <Text style={styles.titulo} accessibilityRole="header">
                Sobre
              </Text>
              <Text style={styles.texto}>{lugar.descricao}</Text>
            </View>
          ) : null}

          {lugar.horarios.length > 0 ? (
            <View style={styles.bloco}>
              <Text style={styles.titulo} accessibilityRole="header">
                Horários
              </Text>
              <SemanaHorarios horarios={lugar.horarios} />
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

function ColunaBilhete({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <View style={styles.coluna} accessible accessibilityLabel={`${valor} ${rotulo}`}>
      <Text style={styles.valorBilhete}>{valor}</Text>
      <Text style={styles.rotuloBilhete}>{rotulo}</Text>
    </View>
  );
}

/** Semana em pílulas (hoje já marcado); tocar num dia mostra o horário dele. */
function SemanaHorarios({ horarios }: { horarios: Horario[] }) {
  const linhas = linhasDeHorario(horarios);
  const [dia, setDia] = useState(hoje());
  const escolhido = linhas[dia]!;
  return (
    <View style={styles.semana}>
      <View style={styles.dias} accessibilityRole="tablist">
        {linhas.map((l, i) => {
          const ativo = i === dia;
          return (
            <Pressable
              key={l.dia}
              onPress={() => setDia(i)}
              accessibilityRole="tab"
              accessibilityState={{ selected: ativo }}
              accessibilityLabel={l.dia}
              style={[
                styles.diaBolha,
                ativo && styles.diaAtivo,
                l.fechado && !ativo && styles.diaFechado,
              ]}
            >
              <Text style={[styles.letraDia, ativo && { color: cores.primariaTexto }]}>
                {l.dia[0]}
              </Text>
              {l.hoje ? (
                <View style={[styles.marcaHoje, ativo && { backgroundColor: cores.sol }]} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
      <View style={styles.horarioEscolhido}>
        <Text style={styles.nomeDia}>
          {escolhido.hoje ? `${escolhido.dia} (hoje)` : escolhido.dia}
        </Text>
        <Text style={[styles.horaDia, escolhido.fechado && { color: cores.erro }]}>
          {escolhido.texto}
        </Text>
      </View>
    </View>
  );
}

function BotaoAcao({
  icone,
  rotulo,
  onPress,
}: {
  icone: NomeIcone;
  rotulo: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={({ pressed }) => [styles.botaoAcao, pressed && { opacity: 0.7 }]}
    >
      <Icone nome={icone} tamanho={22} cor={cores.primaria} />
    </Pressable>
  );
}

function LinhaInfo({
  icone,
  titulo,
  detalhe,
}: {
  icone: NomeIcone;
  titulo: string;
  detalhe?: string;
}) {
  return (
    <View style={styles.linhaInfo}>
      <View style={styles.iconeInfo}>
        <Icone nome={icone} tamanho={18} cor={cores.primaria} />
      </View>
      <View style={styles.textosInfo}>
        <Text style={styles.tituloInfo}>{titulo}</Text>
        {detalhe ? <Text style={styles.secundario}>{detalhe}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.superficie },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: cores.fundo,
  },
  voltarSolto: { position: 'absolute', left: 16 },
  capa: { height: 300, backgroundColor: cores.fundoDestaque },
  foto: { height: 300 },
  semFoto: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  botoesCapa: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  redondo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.18)',
  },
  folha: {
    marginTop: -28,
    padding: 20,
    paddingTop: 24,
    gap: 22,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: cores.superficie,
  },
  bloco: { gap: 10 },
  sobretitulo: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: cores.primaria,
  },
  nome: {
    fontFamily: fonte.titulo,
    fontSize: 32,
    lineHeight: 36,
    color: cores.texto,
    letterSpacing: -0.8,
  },
  letraCapa: { fontFamily: fonte.titulo, fontSize: 180, color: 'rgba(255, 255, 255, 0.18)' },
  resumo: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  nota: { fontSize: 15, fontWeight: '800', color: cores.texto },
  titulo: { fontFamily: fonte.subtitulo, fontSize: 21, color: cores.texto },
  secundario: { fontSize: 14, color: cores.textoSecundario },
  texto: { fontSize: 15, lineHeight: 22, color: cores.texto },
  selos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: raio.pilula,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  textoSelo: { fontSize: 13, fontWeight: '600' },
  acoes: { flexDirection: 'row', gap: 10 },
  botaoAcao: {
    width: 52,
    height: 52,
    borderRadius: raio.campo,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: cores.primaria,
  },
  info: { gap: 14, padding: 16, borderRadius: raio.cartao, backgroundColor: cores.fundo },
  linhaInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconeInfo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.superficie,
  },
  textosInfo: { flex: 1, gap: 2 },
  tituloInfo: { fontSize: 15, fontWeight: '600', color: cores.texto },
  bilhete: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: raio.cartao,
    backgroundColor: cores.fundo,
  },
  recorte: {
    position: 'absolute',
    top: '50%',
    marginTop: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: cores.superficie,
  },
  coluna: { flex: 1, alignItems: 'center', gap: 2 },
  picote: {
    width: 0,
    alignSelf: 'stretch',
    borderLeftWidth: 1.5,
    borderLeftColor: cores.borda,
    borderStyle: 'dashed',
  },
  valorBilhete: { fontFamily: fonte.subtitulo, fontSize: 20, color: cores.texto },
  rotuloBilhete: { fontSize: 12, color: cores.textoSecundario },
  semana: { gap: 12 },
  dias: { flexDirection: 'row', justifyContent: 'space-between' },
  diaBolha: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.fundo,
  },
  diaAtivo: { backgroundColor: cores.tinta },
  diaFechado: { opacity: 0.45 },
  letraDia: { fontSize: 15, fontWeight: '700', color: cores.texto },
  marcaHoje: {
    position: 'absolute',
    bottom: 5,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: cores.primaria,
  },
  horarioEscolhido: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: raio.campo,
    backgroundColor: cores.fundo,
  },
  nomeDia: { fontSize: 15, fontWeight: '600', color: cores.texto },
  horaDia: { fontSize: 15, fontWeight: '700', color: cores.texto },
});
