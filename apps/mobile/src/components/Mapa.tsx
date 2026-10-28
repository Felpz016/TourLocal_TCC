import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import type { Recomendacao } from '../api/recomendacoes';
import type { Posicao } from '../localizacao/LocalizacaoContext';

type Ponto = { latitude: number; longitude: number };
type Props = {
  posicao?: Posicao | null;
  lugares?: Recomendacao[];
  altura?: number;
  /** Centraliza o mapa num lugar só (capa da tela de detalhes). */
  destaque?: Ponto & { nome: string };
};

// Mapa nativo: Apple Maps no iOS e Google Maps no Android (funciona no Expo Go).
export function Mapa({ posicao, lugares = [], altura = 180, destaque }: Props) {
  const centro: Ponto | null | undefined = destaque ?? posicao;
  if (!centro) return null;
  const delta = destaque ? 0.008 : 0.03;
  const regiao = { ...centro, latitudeDelta: delta, longitudeDelta: delta };
  return (
    <MapView
      style={[styles.mapa, { height: altura }]}
      region={regiao}
      showsUserLocation={posicao?.origem === 'gps'}
      scrollEnabled={!destaque}
      accessibilityLabel={
        destaque ? `Mapa de ${destaque.nome}` : 'Mapa com a sua posição e os lugares recomendados'
      }
    >
      {destaque ? (
        <Marker coordinate={destaque} title={destaque.nome} />
      ) : (
        <>
          {posicao?.origem === 'manual' ? (
            <Marker coordinate={posicao} title="Endereço informado" pinColor="blue" />
          ) : null}
          {lugares.map((lugar) => (
            <Marker
              key={lugar.id_estab}
              coordinate={{ latitude: lugar.latitude, longitude: lugar.longitude }}
              title={lugar.nome}
              description={lugar.categorias.join(', ')}
            />
          ))}
        </>
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  mapa: { width: '100%' },
});
