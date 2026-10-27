import { Link } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useLocalizacao } from '../localizacao/LocalizacaoContext';
import { cores } from '../theme/cores';
import { Botao } from './ui/Botao';

/** Mostra de onde vem a posição usada nas recomendações e permite trocá-la. */
export function BarraLocalizacao() {
  const { posicao, status, usarGps } = useLocalizacao();

  // Na primeira vez, pede a localização assim que a tela abre.
  useEffect(() => {
    if (status === 'inicial') usarGps();
  }, [status, usarGps]);

  if (status === 'inicial' || status === 'obtendo') {
    return (
      <View style={styles.barra}>
        <ActivityIndicator color={cores.primaria} />
        <Text style={styles.texto}>Obtendo sua localização…</Text>
      </View>
    );
  }

  if (!posicao) {
    const motivo =
      status === 'negada'
        ? 'Você não permitiu o acesso à localização.'
        : 'Não foi possível obter sua localização.';
    return (
      <View style={[styles.barra, styles.coluna]}>
        <Text style={styles.texto}>{motivo} Informe um endereço de referência.</Text>
        <Link href="/localizacao" style={styles.link}>
          Informar endereço
        </Link>
        <Botao titulo="Tentar o GPS de novo" variante="link" onPress={usarGps} />
      </View>
    );
  }

  return (
    <View style={styles.barra}>
      <Text style={styles.texto} numberOfLines={1}>
        📍 {posicao.origem === 'gps' ? 'Perto de você' : posicao.endereco}
      </Text>
      <Link href="/localizacao" style={styles.link} accessibilityLabel="Alterar localização">
        Alterar
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: cores.fundoCampo,
  },
  coluna: { flexDirection: 'column', alignItems: 'stretch' },
  texto: { flexShrink: 1, fontSize: 15, color: cores.texto },
  link: { color: cores.primaria, fontSize: 15, fontWeight: '600', paddingVertical: 6 },
});
