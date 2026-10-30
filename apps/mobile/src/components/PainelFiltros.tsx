import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { buscarCategorias } from '../api/recomendacoes';
import type { Categoria, Eixo, Filtros } from '../api/recomendacoes';
import type { FaixaPreco } from '../api/tipos';
import { cores } from '../theme/cores';
import { curva, raio } from '../theme/estilo';
import { fonte, tamanho } from '../theme/fontes';
import { Botao } from './ui/Botao';
import { Opcao } from './ui/Opcao';
import { Pressionavel } from './ui/Pressionavel';
import { vibrar } from '../util/vibracao';
import { criarEstilos } from '../theme/tema';

const PRECOS: { valor: FaixaPreco; rotulo: string }[] = [
  { valor: 'economico', rotulo: '$' },
  { valor: 'moderado', rotulo: '$$' },
  { valor: 'alto', rotulo: '$$$' },
];
const NOTAS = [
  { valor: null, rotulo: 'Qualquer' },
  { valor: 3, rotulo: '★ 3+' },
  { valor: 4, rotulo: '★ 4+' },
];

type Props = { eixo: Eixo; filtros: Filtros; onChange: (filtros: Filtros) => void };

/** Chips de categoria (RF09) sobre o topo azul; "Todos" limpa a categoria. */
export function Categorias({ eixo, filtros, onChange }: Props) {
  const styles = useEstilos();
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    buscarCategorias(eixo)
      .then(setCategorias)
      .catch(() => setCategorias([]));
  }, [eixo]);

  const chip = (rotulo: string, ativo: boolean, valor: string | null) => (
    <Pressionavel
      key={rotulo}
      accessibilityRole="radio"
      accessibilityState={{ checked: ativo }}
      onPress={() => {
        if (!ativo) vibrar.selecao();
        onChange({ ...filtros, categoria: valor });
      }}
      style={[styles.chipTopo, ativo && styles.chipTopoAtivo]}
    >
      <Text style={[styles.textoTopo, ativo && styles.textoTopoAtivo]}>{rotulo}</Text>
    </Pressionavel>
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categorias}
      style={styles.rolagem}
    >
      {chip('Todos', !filtros.categoria, null)}
      {categorias.map((c) => chip(c.nome, filtros.categoria === c.nome, c.nome))}
    </ScrollView>
  );
}

/** Quantos filtros da folha estão ligados (a categoria aparece nos chips). */
export function contarFiltros(filtros: Filtros) {
  return (
    (filtros.faixasPreco?.length ? 1 : 0) +
    (filtros.notaMinima ? 1 : 0) +
    (filtros.incluirFechados ? 1 : 0)
  );
}

export function temFiltroAtivo(filtros: Filtros) {
  return !!(filtros.categoria || filtros.faixasPreco?.length || filtros.notaMinima);
}

type PropsFolha = {
  visivel: boolean;
  filtros: Filtros;
  total: number | null;
  onChange: (filtros: Filtros) => void;
  onFechar: () => void;
};

/** Folha que sobe de baixo com os filtros de preço, nota e horário (RF09). */
export function FolhaFiltros({ visivel, filtros, total, onChange, onFechar }: PropsFolha) {
  const styles = useEstilos();
  const { bottom } = useSafeAreaInsets();
  const faixas = filtros.faixasPreco ?? [];
  const alternarPreco = (valor: FaixaPreco) =>
    onChange({
      ...filtros,
      faixasPreco: faixas.includes(valor) ? faixas.filter((f) => f !== valor) : [...faixas, valor],
    });

  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={onFechar}>
      <View style={styles.fundoModal}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onFechar}
          accessibilityRole="button"
          accessibilityLabel="Fechar filtros"
        />
        <View style={[styles.folha, { paddingBottom: Math.max(bottom, 16) }]}>
          <View style={styles.alca} />
          <View style={styles.cabecalho}>
            <Text style={styles.titulo} accessibilityRole="header">
              Filtros
            </Text>
            <Pressable
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Limpar filtros"
              onPress={() => onChange({ categoria: filtros.categoria })}
            >
              <Text style={styles.limpar}>Limpar</Text>
            </Pressable>
          </View>

          <Text style={styles.rotulo}>Preço</Text>
          <View style={styles.linha}>
            {PRECOS.map((p) => (
              <Opcao
                key={p.valor}
                rotulo={p.rotulo}
                selecionada={faixas.includes(p.valor)}
                onPress={() => alternarPreco(p.valor)}
              />
            ))}
          </View>

          <Text style={styles.rotulo}>Nota mínima</Text>
          <View style={styles.linha}>
            {NOTAS.map((n) => (
              <Opcao
                key={n.rotulo}
                rotulo={n.rotulo}
                selecionada={(filtros.notaMinima ?? null) === n.valor}
                onPress={() => onChange({ ...filtros, notaMinima: n.valor })}
              />
            ))}
          </View>

          <View style={styles.interruptor}>
            <View style={styles.textos}>
              <Text style={styles.rotulo}>Mostrar fechados agora</Text>
              <Text style={styles.dica}>Inclui lugares que não estão abertos neste horário.</Text>
            </View>
            <Switch
              accessibilityLabel="Mostrar também os fechados agora"
              value={!!filtros.incluirFechados}
              onValueChange={(v) => onChange({ ...filtros, incluirFechados: v })}
              trackColor={{ true: cores.primaria, false: cores.borda }}
            />
          </View>

          <Botao
            titulo={
              total === null
                ? 'Ver resultados'
                : `Ver ${total} ${total === 1 ? 'lugar' : 'lugares'}`
            }
            onPress={onFechar}
          />
        </View>
      </View>
    </Modal>
  );
}

const useEstilos = criarEstilos(() => ({
  rolagem: { marginHorizontal: -20, flexGrow: 0 },
  categorias: { gap: 8, paddingHorizontal: 20 },
  chipTopo: {
    paddingHorizontal: 16,
    // 44 pt: a menor área de toque recomendada pela Apple (WCAG 2.5.5).
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: raio.pilula,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
  },
  chipTopoAtivo: { backgroundColor: cores.tinta, borderColor: cores.tinta },
  textoTopo: { fontSize: tamanho.rotulo, fontWeight: '600', color: cores.texto },
  textoTopoAtivo: { color: cores.textoSobreTinta, fontWeight: '700' },
  fundoModal: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  folha: {
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopLeftRadius: raio.folha,
    borderTopRightRadius: raio.folha,
    ...curva,
    backgroundColor: cores.superficie,
  },
  alca: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: raio.pilula,
    backgroundColor: cores.linha,
    marginBottom: 4,
  },
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titulo: { fontFamily: fonte.titulo, fontSize: tamanho.titulo, color: cores.texto },
  limpar: { fontSize: tamanho.corpo, fontWeight: '700', color: cores.primaria },
  rotulo: { fontSize: tamanho.corpo, fontWeight: '700', color: cores.texto },
  dica: { fontSize: tamanho.apoio, color: cores.textoSecundario },
  linha: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  interruptor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  textos: { flex: 1, gap: 2 },
}));
