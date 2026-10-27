import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { buscarCategorias } from '../api/recomendacoes';
import type { Categoria, Eixo, Filtros } from '../api/recomendacoes';
import type { FaixaPreco } from '../api/tipos';
import { cores } from '../theme/cores';
import { Opcao } from './ui/Opcao';

const PRECOS: { valor: FaixaPreco; rotulo: string }[] = [
  { valor: 'economico', rotulo: '$' },
  { valor: 'moderado', rotulo: '$$' },
  { valor: 'alto', rotulo: '$$$' },
];

type Props = { eixo: Eixo; filtros: Filtros; onChange: (filtros: Filtros) => void };

/** Filtros adicionais da listagem (RF09): categoria, preço, nota mínima e aberto agora. */
export function PainelFiltros({ eixo, filtros, onChange }: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    buscarCategorias(eixo)
      .then(setCategorias)
      .catch(() => setCategorias([]));
  }, [eixo]);

  const faixas = filtros.faixasPreco ?? [];
  const alternarPreco = (valor: FaixaPreco) =>
    onChange({
      ...filtros,
      faixasPreco: faixas.includes(valor) ? faixas.filter((f) => f !== valor) : [...faixas, valor],
    });

  return (
    <View style={styles.painel}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.linha}
      >
        {categorias.map((c) => (
          <Opcao
            key={c.nome}
            rotulo={c.nome}
            selecionada={filtros.categoria === c.nome}
            onPress={() =>
              onChange({ ...filtros, categoria: filtros.categoria === c.nome ? null : c.nome })
            }
          />
        ))}
      </ScrollView>
      <View style={styles.linha}>
        {PRECOS.map((p) => (
          <Opcao
            key={p.valor}
            rotulo={p.rotulo}
            selecionada={faixas.includes(p.valor)}
            onPress={() => alternarPreco(p.valor)}
          />
        ))}
        <Opcao
          rotulo="★ 4+"
          selecionada={filtros.notaMinima === 4}
          onPress={() => onChange({ ...filtros, notaMinima: filtros.notaMinima === 4 ? null : 4 })}
        />
      </View>
      <View style={styles.interruptor}>
        <Text style={styles.texto}>Mostrar também os fechados agora</Text>
        <Switch
          accessibilityLabel="Mostrar também os fechados agora"
          value={!!filtros.incluirFechados}
          onValueChange={(v) => onChange({ ...filtros, incluirFechados: v })}
          trackColor={{ true: cores.primaria }}
        />
      </View>
    </View>
  );
}

export function temFiltroAtivo(filtros: Filtros) {
  return !!(filtros.categoria || filtros.faixasPreco?.length || filtros.notaMinima);
}

const styles = StyleSheet.create({
  painel: { gap: 10 },
  linha: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  interruptor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  texto: { fontSize: 15, color: cores.texto },
});
