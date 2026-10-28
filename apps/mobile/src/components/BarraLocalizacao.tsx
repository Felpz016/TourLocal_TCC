import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useLocalizacao } from '../localizacao/LocalizacaoContext';
import { cores } from '../theme/cores';
import { raio } from '../theme/estilo';
import { Botao } from './ui/Botao';
import { Icone } from './ui/Icone';

/** Pílula no topo azul que mostra de onde vem a posição e abre a troca de local. */
export function PilulaLocalizacao() {
  const { posicao, status, usarGps } = useLocalizacao();

  // Na primeira vez, pede a localização assim que a tela abre.
  useEffect(() => {
    if (status === 'inicial') usarGps();
  }, [status, usarGps]);

  const texto =
    status === 'inicial' || status === 'obtendo'
      ? 'Localizando…'
      : !posicao
        ? 'Definir local'
        : posicao.origem === 'gps'
          ? 'Perto de você'
          : (posicao.endereco ?? 'Endereço informado');

  return (
    <Pressable
      onPress={() => router.push('/localizacao')}
      accessibilityRole="button"
      accessibilityLabel={`Localização: ${texto}. Alterar`}
      style={({ pressed }) => [styles.pilula, pressed && { opacity: 0.8 }]}
    >
      <Icone nome="location" tamanho={16} cor={cores.primariaTexto} />
      <Text style={styles.textoPilula} numberOfLines={1}>
        {texto}
      </Text>
      <Icone nome="chevron-down" tamanho={14} cor={cores.primariaTexto} />
    </Pressable>
  );
}

/** Cartão mostrado no lugar da lista enquanto não há posição (GPS negado ou buscando). */
export function BarraLocalizacao() {
  const { posicao, status, usarGps } = useLocalizacao();

  if (posicao) return null;

  if (status === 'inicial' || status === 'obtendo') {
    return (
      <View style={[styles.cartao, styles.linha]}>
        <ActivityIndicator color={cores.primaria} />
        <Text style={styles.texto}>Obtendo sua localização…</Text>
      </View>
    );
  }

  const motivo =
    status === 'negada'
      ? 'Você não permitiu o acesso à localização.'
      : 'Não foi possível obter sua localização.';
  return (
    <View style={styles.cartao}>
      <View style={styles.icone}>
        <Icone nome="navigate" tamanho={24} cor={cores.primaria} />
      </View>
      <Text style={styles.titulo}>Onde você está?</Text>
      <Text style={styles.texto}>{motivo} Informe um endereço de referência.</Text>
      <Botao titulo="Informar endereço" onPress={() => router.push('/localizacao')} />
      <Botao titulo="Tentar o GPS de novo" variante="link" onPress={usarGps} />
    </View>
  );
}

const styles = StyleSheet.create({
  pilula: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    maxWidth: 260,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: raio.pilula,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  textoPilula: { flexShrink: 1, fontSize: 14, fontWeight: '700', color: cores.primariaTexto },
  cartao: {
    gap: 10,
    padding: 20,
    borderRadius: raio.cartao,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.divisoria,
  },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icone: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.fundoDestaque,
  },
  titulo: { fontSize: 18, fontWeight: '700', color: cores.texto },
  texto: { flexShrink: 1, fontSize: 15, lineHeight: 21, color: cores.textoSecundario },
});
