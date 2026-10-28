import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { listarMeus } from '../../src/api/gestao';
import type { MeuEstabelecimento } from '../../src/api/gestao';
import { Aviso } from '../../src/components/ui/Aviso';
import { Miniatura } from '../../src/components/Miniatura';
import { Botao } from '../../src/components/ui/Botao';
import { Cabecalho } from '../../src/components/ui/Cabecalho';
import { Icone } from '../../src/components/ui/Icone';
import { Pressionavel } from '../../src/components/ui/Pressionavel';
import { cores } from '../../src/theme/cores';
import { cartaoPlano, raio } from '../../src/theme/estilo';
import { fonte, tamanho } from '../../src/theme/fontes';
import { estilosLargura } from '../../src/theme/layout';

function Situacao({ local }: { local: MeuEstabelecimento }) {
  const [texto, cor, fundo] = local.fechado_temporariamente
    ? ['Fechado temporariamente', cores.erro, cores.fundoErro]
    : local.verificado
      ? ['Verificado · aparece no app', cores.sucesso, '#E3F4EC']
      : ['Aguardando verificação', cores.alerta, cores.fundoAlerta];
  return (
    <View style={[styles.selo, { backgroundColor: fundo }]}>
      <View style={[styles.ponto, { backgroundColor: cor }]} />
      <Text style={[styles.textoSelo, { color: cor }]}>{texto}</Text>
    </View>
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
      setErro('Não foi possível carregar seus locais. Puxe a tela para baixo para tentar de novo.');
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
    <View style={styles.tela}>
      <Cabecalho
        titulo="Meus locais"
        subtitulo="Mantenha os dados em dia para aparecer bem nas recomendações."
      />
      <ScrollView
        contentContainerStyle={[styles.conteudo, estilosLargura.conteudo]}
        refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregar} />}
      >
        <Botao
          titulo="Cadastrar novo local"
          icone="add"
          onPress={() => router.push('/gestao/novo')}
        />
        <Aviso texto={erro} />
        {locais?.length === 0 ? (
          <Text style={styles.vazio}>
            Cadastre seu restaurante, hospedagem ou atração. Depois da verificação pela equipe do
            TourLocal, ele passa a ser recomendado aos turistas por perto.
          </Text>
        ) : null}
        {locais?.map((local) => (
          <Pressionavel
            key={local.id_estab}
            style={({ pressed }) => [styles.cartao, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityHint="Abre a edição do local"
            onPress={() => router.push(`/gestao/${local.id_estab}`)}
          >
            <Miniatura nome={local.nome} tamanho={60} />
            <View style={styles.info}>
              <Text style={styles.nome} numberOfLines={1}>
                {local.nome}
              </Text>
              <Text style={styles.secundario} numberOfLines={1}>
                {local.categorias.join(', ')} · {local.total_fotos}{' '}
                {local.total_fotos === 1 ? 'foto' : 'fotos'}
              </Text>
              <Situacao local={local} />
            </View>
            <Icone nome="chevron-forward" tamanho={18} cor={cores.textoSecundario} />
          </Pressionavel>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: 20, paddingTop: 8, gap: 12 },
  vazio: {
    fontSize: tamanho.corpo,
    lineHeight: 21,
    color: cores.textoSecundario,
    textAlign: 'center',
  },
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: raio.cartao,
    ...cartaoPlano,
  },
  info: { flex: 1, gap: 4 },
  nome: { fontFamily: fonte.subtitulo, fontSize: tamanho.destaque, color: cores.texto },
  secundario: { fontSize: tamanho.apoio, color: cores.textoSecundario },
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: raio.pilula,
  },
  ponto: { width: 6, height: 6, borderRadius: raio.pilula },
  textoSelo: { fontSize: tamanho.legenda, fontWeight: '700' },
});
