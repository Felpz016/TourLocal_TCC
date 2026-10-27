import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { verificarApi } from '../api/client';

type Props = {
  titulo: string;
  descricao: string;
};

// Tela provisória de cada eixo; a listagem real chega na Sprint 3 (RF06).
export function EixoPlaceholder({ titulo, descricao }: Props) {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    verificarApi().then(setApiOnline);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo} accessibilityRole="header">
        {titulo}
      </Text>
      <Text style={styles.descricao}>{descricao}</Text>
      <Text style={styles.status}>
        {apiOnline === null ? 'Verificando API…' : apiOnline ? 'API conectada' : 'API indisponível'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  titulo: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  descricao: { fontSize: 16, textAlign: 'center', color: '#444' },
  status: { marginTop: 24, fontSize: 14, color: '#666' },
});
