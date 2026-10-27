import { Stack, router, useLocalSearchParams } from 'expo-router';
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
} from 'react-native';

import { ApiError } from '../../src/api/client';
import { buscarDetalhe, definirFavorito } from '../../src/api/estabelecimentos';
import type { Detalhe, Horario } from '../../src/api/estabelecimentos';
import { urlFoto } from '../../src/api/gestao';
import { useAuth } from '../../src/auth/AuthContext';
import { SecaoAvaliacoes } from '../../src/components/detalhe/SecaoAvaliacoes';
import { Aviso } from '../../src/components/ui/Aviso';
import { Botao } from '../../src/components/ui/Botao';
import { useLocalizacao } from '../../src/localizacao/LocalizacaoContext';
import { cores } from '../../src/theme/cores';
import { estilosLargura } from '../../src/theme/layout';
import { PRECO, formatarDistancia, formatarNota } from '../../src/util/formato';
import { abrirRota } from '../../src/util/rota';

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
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
    return { dia, texto };
  });
}

function BotaoFavorito({ ativo, onPress }: { ativo: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
      accessibilityLabel={ativo ? 'Remover dos salvos' : 'Salvar local'}
      style={styles.favorito}
    >
      <Text style={{ fontSize: 24, color: ativo ? cores.favorito : cores.textoSecundario }}>
        {ativo ? '♥' : '♡'}
      </Text>
    </Pressable>
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
      <View style={styles.centro}>
        <Stack.Screen options={{ title: 'Local' }} />
        {erro ? <Aviso texto={erro} /> : <ActivityIndicator color={cores.primaria} />}
      </View>
    );
  }

  const resumo = [
    lugar.categorias.join(', '),
    lugar.faixa_preco ? PRECO[lugar.faixa_preco] : null,
    lugar.nota_media !== null ? `★ ${formatarNota(lugar.nota_media)}` : null,
  ].filter(Boolean);

  return (
    <ScrollView contentContainerStyle={[styles.conteudo, estilosLargura.conteudo]}>
      <Stack.Screen
        options={{
          title: lugar.nome,
          headerRight: turista
            ? () => <BotaoFavorito ativo={lugar.favorito} onPress={alternarFavorito} />
            : lugar.pode_editar
              ? () => (
                  <Pressable
                    onPress={() => router.push(`/gestao/${lugar.id_estab}`)}
                    accessibilityRole="button"
                    hitSlop={12}
                    style={styles.favorito}
                  >
                    <Text style={styles.editar}>Editar</Text>
                  </Pressable>
                )
              : undefined,
        }}
      />
      {lugar.fotos.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.fotos}
        >
          {lugar.fotos.map((foto) => (
            <Image
              key={foto.url}
              source={{ uri: urlFoto(foto.url) }}
              style={styles.foto}
              accessibilityLabel={foto.legenda ?? `Foto de ${lugar.nome}`}
            />
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.bloco}>
        <Text style={styles.nome} accessibilityRole="header">
          {lugar.nome}
        </Text>
        <Text style={styles.secundario}>{resumo.join(' · ')}</Text>
        <View style={styles.selos}>
          {lugar.aberto_agora === true ? <Text style={styles.selo}>Aberto agora</Text> : null}
          {!lugar.verificado ? (
            <Text style={[styles.selo, styles.seloPendente]}>Aguardando verificação</Text>
          ) : null}
          {lugar.fechado_temporariamente ? (
            <Text style={[styles.selo, styles.seloFechado]}>Fechado temporariamente</Text>
          ) : null}
          {lugar.aberto_agora === false && !lugar.fechado_temporariamente ? (
            <Text style={[styles.selo, styles.seloFechado]}>Fechado agora</Text>
          ) : null}
          {lugar.acessibilidade ? <Text style={styles.selo}>♿ Acessível</Text> : null}
          {lugar.opcoes_alimentares.map((o) => (
            <Text key={o} style={styles.selo}>
              {DIETAS[o] ?? o}
            </Text>
          ))}
        </View>
      </View>

      <Aviso texto={erro} />

      <View style={styles.bloco}>
        <Botao
          titulo="Como chegar"
          onPress={() =>
            abrirRota({ latitude: lugar.latitude, longitude: lugar.longitude, nome: lugar.nome })
          }
        />
        <Text style={styles.secundario}>
          {lugar.endereco}
          {lugar.distancia_km !== null ? ` · ${formatarDistancia(lugar.distancia_km)} de você` : ''}
        </Text>
        <View style={styles.contato}>
          {lugar.telefone ? (
            <Botao
              titulo={`Ligar: ${lugar.telefone}`}
              variante="link"
              onPress={() => Linking.openURL(`tel:${lugar.telefone!.replace(/[^\d+]/g, '')}`)}
            />
          ) : null}
          {lugar.site ? (
            <Botao
              titulo="Abrir site"
              variante="link"
              onPress={() => Linking.openURL(lugar.site!)}
            />
          ) : null}
        </View>
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
          {linhasDeHorario(lugar.horarios).map(({ dia, texto }) => (
            <View key={dia} style={styles.horario}>
              <Text style={[styles.texto, styles.dia]}>{dia}</Text>
              <Text style={styles.texto}>{texto}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <SecaoAvaliacoes
        key={lugar.minha_avaliacao?.id_avaliacao ?? 'nova'}
        lugar={lugar}
        podeAvaliar={turista}
        aoMudar={carregar}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  conteudo: { padding: 16, gap: 20, backgroundColor: cores.fundo },
  fotos: { gap: 8 },
  foto: { width: 260, height: 170, borderRadius: 12, backgroundColor: cores.fundoCampo },
  bloco: { gap: 8 },
  nome: { fontSize: 24, fontWeight: '700', color: cores.texto },
  titulo: { fontSize: 20, fontWeight: '700', color: cores.texto },
  secundario: { fontSize: 15, color: cores.textoSecundario },
  texto: { fontSize: 15, color: cores.texto },
  selos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  selo: {
    fontSize: 13,
    color: cores.primaria,
    backgroundColor: cores.fundoDestaque,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  seloFechado: { color: cores.erro, backgroundColor: '#FDECEA' },
  seloPendente: { color: '#7A4A00', backgroundColor: '#FFF4E0' },
  editar: { color: cores.primaria, fontSize: 16, fontWeight: '600' },
  contato: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  horario: { flexDirection: 'row', gap: 12 },
  dia: { width: 40, fontWeight: '600' },
  favorito: {
    marginRight: 16,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
