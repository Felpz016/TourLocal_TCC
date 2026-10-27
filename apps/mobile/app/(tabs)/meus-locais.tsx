import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { listarMeus } from '../../src/api/gestao';
import type { MeuEstabelecimento } from '../../src/api/gestao';
import { Aviso } from '../../src/components/ui/Aviso';
import { Botao } from '../../src/components/ui/Botao';
import { cores } from '../../src/theme/cores';
import { estilosLargura } from '../../src/theme/layout';

function Situacao({ local }: { local: MeuEstabelecimento }) {
  if (local.fechado_temporariamente) {
    return <Text style={[styles.selo, styles.seloAlerta]}>Fechado temporariamente</Text>;
  }
  return local.verificado ? (
    <Text style={styles.selo}>Verificado · aparece no app</Text>
  ) : (
    <Text style={[styles.selo, styles.seloPendente]}>Aguardando verificação</Text>
  );
}

// Painel do comerciante (UC10, UC11): os locais dele e a situação de cada um.
export default function MeusLocaisTela() {
  const [locais, setLocais] = useState<MeuEstabelecimento[] | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setLocais(await listarMeus());
      setErro(null);
    } catch {
      setErro('Não foi possível carregar seus locais.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  return (
    <ScrollView
      contentContainerStyle={[styles.conteudo, estilosLargura.conteudo]}
      refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregar} />}
    >
      <Botao titulo="Cadastrar novo local" onPress={() => router.push('/gestao/novo')} />
      <Aviso texto={erro} />
      {locais?.length === 0 ? (
        <Text style={styles.vazio}>
          Cadastre seu restaurante, hospedagem ou atração. Depois da verificação pela equipe do
          TourLocal, ele passa a ser recomendado aos turistas por perto.
        </Text>
      ) : null}
      {locais?.map((local) => (
        <Pressable
          key={local.id_estab}
          style={({ pressed }) => [styles.cartao, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityHint="Abre a edição do local"
          onPress={() => router.push(`/gestao/${local.id_estab}`)}
        >
          <Text style={styles.nome}>{local.nome}</Text>
          <Text style={styles.secundario}>
            {local.categorias.join(', ')} · {local.total_fotos}{' '}
            {local.total_fotos === 1 ? 'foto' : 'fotos'}
          </Text>
          <Text style={styles.secundario} numberOfLines={1}>
            {local.endereco}
          </Text>
          <View style={styles.linha}>
            <Situacao local={local} />
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: { padding: 16, gap: 12 },
  vazio: { fontSize: 16, color: cores.textoSecundario, textAlign: 'center', paddingVertical: 16 },
  cartao: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E2E2',
    backgroundColor: cores.fundo,
    gap: 4,
  },
  nome: { fontSize: 17, fontWeight: '700', color: cores.texto },
  secundario: { fontSize: 14, color: cores.textoSecundario },
  linha: { flexDirection: 'row', marginTop: 4 },
  selo: {
    fontSize: 13,
    fontWeight: '600',
    color: cores.primaria,
    backgroundColor: cores.fundoDestaque,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  seloPendente: { color: '#7A4A00', backgroundColor: '#FFF4E0' },
  seloAlerta: { color: cores.erro, backgroundColor: '#FDECEA' },
});
