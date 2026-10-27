import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '../../src/api/client';
import {
  aprovar,
  decidirDenuncia,
  listarDenunciadas,
  listarPendentes,
  rejeitar,
} from '../../src/api/gestao';
import type { Denuncia, Pendente } from '../../src/api/gestao';
import { Estrelas } from '../../src/components/detalhe/Estrelas';
import { Aviso } from '../../src/components/ui/Aviso';
import { Botao } from '../../src/components/ui/Botao';
import { cores } from '../../src/theme/cores';
import { estilosLargura } from '../../src/theme/layout';

// Moderação (UC12, RF18): verificar cadastros (RN01) e decidir denúncias (RN06).
export default function ModeracaoTela() {
  const [pendentes, setPendentes] = useState<Pendente[]>([]);
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [carregando, setCarregando] = useState(false);
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
    <ScrollView
      contentContainerStyle={[styles.conteudo, estilosLargura.conteudo]}
      refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregar} />}
    >
      <Aviso texto={aviso?.texto ?? null} tipo={aviso?.tipo} />

      <Text style={styles.titulo} accessibilityRole="header">
        Cadastros aguardando verificação ({pendentes.length})
      </Text>
      {pendentes.length === 0 ? <Text style={styles.vazio}>Nenhum cadastro pendente.</Text> : null}
      {pendentes.map((p) => (
        <View key={p.id_estab} style={styles.cartao}>
          <Link href={`/lugar/${p.id_estab}`} style={styles.nome}>
            {p.nome}
          </Link>
          <Text style={styles.secundario}>{p.categorias.join(', ')}</Text>
          <Text style={styles.secundario}>{p.endereco}</Text>
          <Text style={styles.secundario}>
            {p.responsavel
              ? `Responsável: ${p.responsavel} (${p.email_responsavel})`
              : 'Sem responsável'}
          </Text>
          <View style={styles.acoes}>
            <Botao
              titulo="Aprovar"
              variante="link"
              onPress={() => executar(() => aprovar(p.id_estab), `"${p.nome}" foi aprovado.`)}
            />
            <Botao
              titulo="Rejeitar"
              variante="link"
              onPress={() => executar(() => rejeitar(p.id_estab), `"${p.nome}" foi rejeitado.`)}
            />
          </View>
        </View>
      ))}

      <Text style={styles.titulo} accessibilityRole="header">
        Avaliações denunciadas ({denuncias.length})
      </Text>
      {denuncias.length === 0 ? (
        <Text style={styles.vazio}>Nenhuma denúncia em aberto.</Text>
      ) : null}
      {denuncias.map((d) => (
        <View key={d.id_avaliacao} style={styles.cartao}>
          <Text style={styles.nome}>{d.estabelecimento}</Text>
          <View style={styles.acoes}>
            <Text style={styles.secundario}>{d.autor}</Text>
            <Estrelas nota={d.nota} tamanho={14} />
          </View>
          <Text style={styles.comentario}>{d.comentario ?? '(sem comentário)'}</Text>
          <View style={styles.acoes}>
            <Botao
              titulo="Manter publicada"
              variante="link"
              onPress={() =>
                executar(() => decidirDenuncia(d.id_avaliacao, true), 'Avaliação mantida.')
              }
            />
            <Botao
              titulo="Remover"
              variante="link"
              onPress={() =>
                executar(() => decidirDenuncia(d.id_avaliacao, false), 'Avaliação removida.')
              }
            />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: { padding: 16, gap: 12 },
  titulo: { fontSize: 18, fontWeight: '700', color: cores.texto, marginTop: 8 },
  vazio: { fontSize: 15, color: cores.textoSecundario },
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
  comentario: { fontSize: 15, color: cores.texto },
  acoes: { flexDirection: 'row', gap: 16, alignItems: 'center', flexWrap: 'wrap' },
});
