import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

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
import { Segmentado } from '../../src/components/ui/Segmentado';
import { cores } from '../../src/theme/cores';
import { cartaoPlano, curva, raio } from '../../src/theme/estilo';
import { fonte, tamanho } from '../../src/theme/fontes';
import { estilosLargura } from '../../src/theme/layout';
import { vibrar } from '../../src/util/vibracao';
import { criarEstilos } from '../../src/theme/tema';

// Moderação (UC12, RF18): verificar cadastros (RN01) e decidir denúncias (RN06).
export default function ModeracaoTela() {
  const styles = useEstilos();
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
      setAviso({
        texto: 'Não foi possível carregar a moderação. Puxe a tela para baixo para tentar de novo.',
        tipo: 'erro',
      });
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
      vibrar.sucesso();
      setAviso({ texto: sucesso, tipo: 'sucesso' });
      await carregar();
    } catch (e) {
      vibrar.erro();
      setAviso({
        texto:
          e instanceof ApiError ? e.message : 'Não deu certo agora. Tente de novo em instantes.',
        tipo: 'erro',
      });
    }
  }

  return (
    <View style={styles.tela}>
      <Cabecalho titulo="Moderação">
        {/* Abas no estilo do controle segmentado do iOS. */}
        <View style={styles.segmentos}>
          <Segmentado
            papel="abas"
            valor={aba}
            onChange={setAba}
            opcoes={[
              { valor: 'cadastros', rotulo: `Cadastros · ${pendentes.length}` },
              { valor: 'denuncias', rotulo: `Denúncias · ${denuncias.length}` },
            ]}
          />
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

const useEstilos = criarEstilos(() => ({
  tela: { flex: 1, backgroundColor: cores.fundo },
  segmentos: { marginTop: 12 },
  conteudo: { padding: 20, paddingTop: 8, gap: 12 },
  vazio: {
    fontSize: tamanho.corpo,
    color: cores.textoSecundario,
    textAlign: 'center',
    paddingVertical: 24,
  },
  cartao: {
    gap: 12,
    padding: 16,
    borderRadius: raio.cartao,
    ...cartaoPlano,
  },
  topo: { flexDirection: 'row', gap: 12 },
  info: { flex: 1, gap: 3 },
  topoDenuncia: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nome: { fontFamily: fonte.subtitulo, fontSize: tamanho.destaque, color: cores.texto },
  secundario: { fontSize: tamanho.apoio, color: cores.textoSecundario },
  linha: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  citacao: {
    fontSize: tamanho.corpo,
    lineHeight: 21,
    color: cores.texto,
    padding: 12,
    borderRadius: raio.campo,
    ...curva,
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
  textoSelo: { fontSize: tamanho.legenda, fontWeight: '700', color: cores.erro },
  acoes: { flexDirection: 'row', gap: 10 },
}));
