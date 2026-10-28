import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '../../src/api/client';
import {
  aprovar,
  decidirDenuncia,
  listarDenunciadas,
  listarPendentes,
  rejeitar,
} from '../../src/api/gestao';
import type { Denuncia, Pendente } from '../../src/api/gestao';
import { Miniatura } from '../../src/components/Miniatura';
import { Estrelas } from '../../src/components/detalhe/Estrelas';
import { Aviso } from '../../src/components/ui/Aviso';
import { Botao } from '../../src/components/ui/Botao';
import { Cabecalho } from '../../src/components/ui/Cabecalho';
import { Icone } from '../../src/components/ui/Icone';
import { cores } from '../../src/theme/cores';
import { cartaoPlano, raio, sombra } from '../../src/theme/estilo';
import { fonte } from '../../src/theme/fontes';
import { estilosLargura } from '../../src/theme/layout';

// Moderação (UC12, RF18): verificar cadastros (RN01) e decidir denúncias (RN06).
export default function ModeracaoTela() {
  const [pendentes, setPendentes] = useState<Pendente[]>([]);
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [aba, setAba] = useState<'cadastros' | 'denuncias'>('cadastros');
  const [aviso, setAviso] = useState<{ texto: string; tipo: 'erro' | 'sucesso' } | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [p, d] = await Promise.all([listarPendentes(), listarDenunciadas()]);
      setPendentes(p);
      setDenuncias(d);
    } catch {
      setAviso({ texto: 'Não foi possível carregar a moderação.', tipo: 'erro' });
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  async function executar(acao: () => Promise<void>, sucesso: string) {
    try {
      await acao();
      setAviso({ texto: sucesso, tipo: 'sucesso' });
      await carregar();
    } catch (e) {
      setAviso({
        texto: e instanceof ApiError ? e.message : 'Não foi possível concluir.',
        tipo: 'erro',
      });
    }
  }

  return (
    <View style={styles.tela}>
      <Cabecalho titulo="Moderação">
        {/* Abas no estilo do controle segmentado do iOS. */}
        <View style={styles.segmentos} accessibilityRole="tablist">
          {(
            [
              ['cadastros', `Cadastros · ${pendentes.length}`],
              ['denuncias', `Denúncias · ${denuncias.length}`],
            ] as const
          ).map(([valor, rotulo]) => (
            <Pressable
              key={valor}
              onPress={() => setAba(valor)}
              accessibilityRole="tab"
              accessibilityState={{ selected: aba === valor }}
              style={[styles.segmento, aba === valor && styles.segmentoAtivo]}
            >
              <Text style={[styles.textoSegmento, aba === valor && styles.textoSegmentoAtivo]}>
                {rotulo}
              </Text>
            </Pressable>
          ))}
        </View>
      </Cabecalho>
      <ScrollView
        contentContainerStyle={[styles.conteudo, estilosLargura.conteudo]}
        refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregar} />}
      >
        <Aviso texto={aviso?.texto ?? null} tipo={aviso?.tipo} />

        {aba === 'cadastros' && pendentes.length === 0 ? (
          <Text style={styles.vazio}>Nenhum cadastro aguardando verificação.</Text>
        ) : null}
        {aba === 'cadastros'
          ? pendentes.map((p) => (
              <View key={p.id_estab} style={styles.cartao}>
                <View style={styles.topo}>
                  <Miniatura nome={p.nome} tamanho={52} />
                  <View style={styles.info}>
                    <Link href={`/lugar/${p.id_estab}`} style={styles.nome}>
                      {p.nome}
                    </Link>
                    <Text style={styles.secundario}>
                      {p.categorias.join(', ')} · {p.endereco}
                    </Text>
                    <Text style={styles.secundario}>
                      {p.responsavel
                        ? `Responsável: ${p.responsavel} (${p.email_responsavel})`
                        : 'Sem responsável'}
                    </Text>
                  </View>
                </View>
                <View style={styles.acoes}>
                  <Botao
                    titulo="Rejeitar"
                    variante="perigo"
                    flexivel
                    onPress={() =>
                      executar(() => rejeitar(p.id_estab), `"${p.nome}" foi rejeitado.`)
                    }
                  />
                  <Botao
                    titulo="Aprovar"
                    icone="checkmark"
                    flexivel
                    onPress={() => executar(() => aprovar(p.id_estab), `"${p.nome}" foi aprovado.`)}
                  />
                </View>
              </View>
            ))
          : null}

        {aba === 'denuncias' && denuncias.length === 0 ? (
          <Text style={styles.vazio}>Nenhuma denúncia em aberto.</Text>
        ) : null}
        {aba === 'denuncias'
          ? denuncias.map((d) => (
              <View key={d.id_avaliacao} style={styles.cartao}>
                <View style={styles.topoDenuncia}>
                  <Text style={styles.nome}>{d.estabelecimento}</Text>
                  <View style={styles.selo}>
                    <Icone nome="flag" tamanho={12} cor={cores.erro} />
                    <Text style={styles.textoSelo}>Denunciada</Text>
                  </View>
                </View>
                <View style={styles.linha}>
                  <Text style={styles.secundario}>{d.autor}</Text>
                  <Estrelas nota={d.nota} tamanho={12} />
                </View>
                <Text style={styles.citacao}>“{d.comentario ?? 'sem comentário'}”</Text>
                <View style={styles.acoes}>
                  <Botao
                    titulo="Manter"
                    variante="secundario"
                    flexivel
                    onPress={() =>
                      executar(() => decidirDenuncia(d.id_avaliacao, true), 'Avaliação mantida.')
                    }
                  />
                  <Botao
                    titulo="Remover"
                    variante="perigo"
                    flexivel
                    onPress={() =>
                      executar(() => decidirDenuncia(d.id_avaliacao, false), 'Avaliação removida.')
                    }
                  />
                </View>
              </View>
            ))
          : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  segmentos: {
    flexDirection: 'row',
    padding: 4,
    marginTop: 12,
    borderRadius: raio.campo,
    backgroundColor: cores.divisoria,
  },
  segmento: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  segmentoAtivo: { backgroundColor: cores.superficie, ...sombra },
  textoSegmento: { fontSize: 14, fontWeight: '600', color: cores.textoSecundario },
  textoSegmentoAtivo: { color: cores.texto, fontWeight: '700' },
  conteudo: { padding: 20, paddingTop: 8, gap: 12 },
  vazio: { fontSize: 15, color: cores.textoSecundario, textAlign: 'center', paddingVertical: 24 },
  cartao: {
    gap: 12,
    padding: 16,
    borderRadius: raio.cartao,
    ...cartaoPlano,
  },
  topo: { flexDirection: 'row', gap: 12 },
  info: { flex: 1, gap: 3 },
  topoDenuncia: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nome: { fontFamily: fonte.subtitulo, fontSize: 17, color: cores.texto },
  secundario: { fontSize: 13, color: cores.textoSecundario },
  linha: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  citacao: {
    fontSize: 15,
    lineHeight: 21,
    color: cores.texto,
    padding: 12,
    borderRadius: raio.campo,
    backgroundColor: cores.fundo,
    overflow: 'hidden',
  },
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: raio.pilula,
    backgroundColor: cores.fundoErro,
  },
  textoSelo: { fontSize: 12, fontWeight: '700', color: cores.erro },
  acoes: { flexDirection: 'row', gap: 10 },
});
