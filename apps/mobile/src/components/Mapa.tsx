import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import type { Posicao } from '../localizacao/LocalizacaoContext';

type Props = { posicao: Posicao };

// Mapa nativo: Apple Maps no iOS e Google Maps no Android (funciona no Expo Go).
export function Mapa({ posicao }: Props) {
  const regiao = {
    latitude: posicao.latitude,
    longitude: posicao.longitude,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };
  return (
    <MapView
      style={styles.mapa}
      region={regiao}
      showsUserLocation={posicao.origem === 'gps'}
      accessibilityLabel="Mapa com a sua posição"
    >
      {posicao.origem === 'manual' ? (
        <Marker coordinate={posicao} title="Endereço informado" description={posicao.endereco} />
      ) : null}
    </MapView>
  );
}

const styles = StyleSheet.create({
  mapa: { width: '100%', height: 220, borderRadius: 12 },
});
