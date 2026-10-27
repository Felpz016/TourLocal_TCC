import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLocalizacao } from '../localizacao/LocalizacaoContext';
import { cores } from '../theme/cores';
import { BarraLocalizacao } from './BarraLocalizacao';
import { Mapa } from './Mapa';

type Props = { titulo: string; descricao: string };

// Tela de cada eixo. A listagem de recomendações entra na Sprint 3 (RF06).
export function EixoTela({ titulo, descricao }: Props) {
  const { posicao } = useLocalizacao();

  return (
    <ScrollView contentContainerStyle={styles.conteudo}>
      <BarraLocalizacao />
      {posicao ? <Mapa posicao={posicao} /> : null}
      <View style={styles.vazio}>
        <Text style={styles.titulo} accessibilityRole="header">
          {titulo}
        </Text>
        <Text style={styles.descricao}>{descricao}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: { padding: 16, gap: 16 },
  vazio: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  titulo: { fontSize: 22, fontWeight: '700', color: cores.texto },
  descricao: { fontSize: 16, textAlign: 'center', color: cores.textoSecundario },
});
