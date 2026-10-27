import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '../../api/client';
import { avaliar, buscarAvaliacoes, denunciar, excluirAvaliacao } from '../../api/estabelecimentos';
import type { Avaliacao, Detalhe } from '../../api/estabelecimentos';
import { cores } from '../../theme/cores';
import { formatarNota } from '../../util/formato';
import { Aviso } from '../ui/Aviso';
import { Botao } from '../ui/Botao';
import { Campo } from '../ui/Campo';
import { Estrelas } from './Estrelas';

type Props = {
  lugar: Detalhe;
  podeAvaliar: boolean;
  /** Recarrega os detalhes para atualizar a média depois de avaliar (RN05). */
  aoMudar: () => void;
};

const data = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

function ItemAvaliacao({
  avaliacao,
  aoDenunciar,
}: {
  avaliacao: Avaliacao;
  aoDenunciar: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  return (
    <View style={styles.item}>
      <View style={styles.itemTopo}>
        <Text style={styles.autor}>{avaliacao.minha ? 'Você' : avaliacao.autor}</Text>
        <Estrelas nota={avaliacao.nota} tamanho={14} />
        <Text style={styles.data}>{data(avaliacao.data_registro)}</Text>
      </View>
      {avaliacao.comentario ? <Text style={styles.comentario}>{avaliacao.comentario}</Text> : null}
      {/* RN06: a denúncia esconde a avaliação até a moderação decidir. */}
      {!avaliacao.minha && !confirmando ? (
        <Pressable onPress={() => setConfirmando(true)} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.denunciar}>Denunciar</Text>
        </Pressable>
      ) : null}
      {confirmando ? (
        <View style={styles.confirmacao}>
          <Text style={styles.comentario}>Denunciar esta avaliação como imprópria?</Text>
          <View style={styles.linha}>
            <Pressable onPress={aoDenunciar} accessibilityRole="button" hitSlop={8}>
              <Text style={[styles.denunciar, { color: cores.erro }]}>Sim, denunciar</Text>
            </Pressable>
            <Pressable onPress={() => setConfirmando(false)} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.denunciar}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function SecaoAvaliacoes({ lugar, podeAvaliar, aoMudar }: Props) {
  const minha = lugar.minha_avaliacao;
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [nota, setNota] = useState(minha?.nota ?? 0);
  const [comentario, setComentario] = useState(minha?.comentario ?? '');
  const [editando, setEditando] = useState(!minha);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; tipo: 'erro' | 'sucesso' } | null>(null);

  const carregar = useCallback(async () => {
    try {
      setAvaliacoes(await buscarAvaliacoes(lugar.id_estab));
    } catch {
      setAviso({ texto: 'Não foi possível carregar as avaliações.', tipo: 'erro' });
    }
  }, [lugar.id_estab]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function executar(acao: () => Promise<unknown>, sucesso: string) {
    setSalvando(true);
    setAviso(null);
    try {
      await acao();
      setAviso({ texto: sucesso, tipo: 'sucesso' });
      await carregar();
      aoMudar();
      return true;
    } catch (e) {
      setAviso({
        texto: e instanceof ApiError ? e.message : 'Não foi possível concluir.',
        tipo: 'erro',
      });
      return false;
    } finally {
      setSalvando(false);
    }
  }

  async function salvar() {
    if (nota < 1) {
      setAviso({ texto: 'Escolha uma nota de 1 a 5 estrelas.', tipo: 'erro' });
      return;
    }
    const ok = await executar(
      () => avaliar(lugar.id_estab, nota, comentario),
      'Obrigado! Sua avaliação foi publicada.',
    );
    if (ok) setEditando(false);
  }

  async function excluir() {
    const ok = await executar(() => excluirAvaliacao(lugar.id_estab), 'Avaliação excluída.');
    if (ok) {
      setNota(0);
      setComentario('');
      setEditando(true);
    }
  }

  return (
    <View style={styles.secao}>
      <Text style={styles.titulo} accessibilityRole="header">
        Avaliações
      </Text>
      <Text style={styles.resumo}>
        {lugar.nota_media !== null
          ? `★ ${formatarNota(lugar.nota_media)} · ${lugar.total_avaliacoes} ${
              lugar.total_avaliacoes === 1 ? 'avaliação' : 'avaliações'
            }`
          : 'Ainda sem avaliações.'}
      </Text>

      {podeAvaliar && editando ? (
        <View style={styles.formulario}>
          <Text style={styles.subtitulo}>
            {minha ? 'Editar sua avaliação' : 'Avalie este lugar'}
          </Text>
          <Estrelas nota={nota} onChange={setNota} />
          <Campo
            rotulo="Comentário (opcional)"
            value={comentario}
            onChangeText={setComentario}
            multiline
            maxLength={1000}
            placeholder="Conte como foi a sua experiência"
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
          <Botao titulo="Publicar avaliação" onPress={salvar} carregando={salvando} />
          {minha ? (
            <Botao titulo="Cancelar" variante="link" onPress={() => setEditando(false)} />
          ) : null}
        </View>
      ) : null}
      {podeAvaliar && !editando ? (
        <View style={styles.linha}>
          <Botao
            titulo="Editar minha avaliação"
            variante="link"
            onPress={() => setEditando(true)}
          />
          <Botao titulo="Excluir" variante="link" onPress={excluir} carregando={salvando} />
        </View>
      ) : null}

      <Aviso texto={aviso?.texto ?? null} tipo={aviso?.tipo} />

      {avaliacoes.map((a) => (
        <ItemAvaliacao
          key={a.id_avaliacao}
          avaliacao={a}
          aoDenunciar={() =>
            executar(() => denunciar(a.id_avaliacao), 'Denúncia enviada. A avaliação foi ocultada.')
          }
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  secao: { gap: 10 },
  titulo: { fontSize: 20, fontWeight: '700', color: cores.texto },
  subtitulo: { fontSize: 16, fontWeight: '700', color: cores.texto },
  resumo: { fontSize: 15, color: cores.textoSecundario },
  formulario: {
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: cores.fundoCampo,
  },
  linha: { flexDirection: 'row', gap: 16, alignItems: 'center', flexWrap: 'wrap' },
  item: { gap: 4, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#E2E2E2' },
  itemTopo: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  autor: { fontSize: 15, fontWeight: '700', color: cores.texto },
  data: { fontSize: 13, color: cores.textoSecundario },
  comentario: { fontSize: 15, color: cores.texto },
  denunciar: { fontSize: 14, color: cores.textoSecundario, fontWeight: '600', paddingVertical: 4 },
  confirmacao: { gap: 4 },
});
