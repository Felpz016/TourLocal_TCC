import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import type { Recomendacao } from '../api/recomendacoes';
import type { Posicao } from '../localizacao/LocalizacaoContext';

type Props = { posicao: Posicao; lugares?: Recomendacao[]; altura?: number };

// Mapa nativo: Apple Maps no iOS e Google Maps no Android (funciona no Expo Go).
export function Mapa({ posicao, lugares = [], altura = 180 }: Props) {
  const regiao = {
    latitude: posicao.latitude,
    longitude: posicao.longitude,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  };
  return (
    <MapView
      style={[styles.mapa, { height: altura }]}
      region={regiao}
      showsUserLocation={posicao.origem === 'gps'}
      accessibilityLabel="Mapa com a sua posição e os lugares recomendados"
    >
      {posicao.origem === 'manual' ? (
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
    </MapView>
  );
}

const styles = StyleSheet.create({
  mapa: { width: '100%' },
});
