import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import type { Recomendacao } from '../api/recomendacoes';
import type { Posicao } from '../localizacao/LocalizacaoContext';
import { useTema } from '../theme/tema';

type Ponto = { latitude: number; longitude: number };
type Props = {
  posicao?: Posicao | null;
  lugares?: Recomendacao[];
  altura?: number;
  /** Centraliza o mapa num lugar só (capa da tela de detalhes). */
  destaque?: Ponto & { nome: string };
  /** Parte de baixo do mapa coberta pela lista: o centro sobe para a área que aparece. */
  margemInferior?: number;
};

// Mapa nativo: Apple Maps no iOS e Google Maps no Android (funciona no Expo Go).
export function Mapa({ posicao, lugares = [], altura = 180, destaque, margemInferior = 0 }: Props) {
  const { esquema } = useTema();
  const centro: Ponto | null | undefined = destaque ?? posicao;
  const delta = destaque ? 0.008 : 0.03;
  // A mesma região entre renderizações, para o mapa não voltar ao centro enquanto a pessoa
  // arrasta; ele só recentraliza quando a posição muda de verdade.
  const lat = centro?.latitude;
  const lng = centro?.longitude;
  const regiao = useMemo(
    () =>
      lat !== undefined && lng !== undefined
        ? { latitude: lat, longitude: lng, latitudeDelta: delta, longitudeDelta: delta }
        : null,
    [lat, lng, delta],
  );
  if (!regiao) return null;
  return (
    <MapView
      style={[styles.mapa, { height: altura }]}
      region={regiao}
      mapPadding={{ top: 0, right: 0, bottom: margemInferior, left: 0 }}
      showsUserLocation={posicao?.origem === 'gps'}
      scrollEnabled={!destaque}
      // Apple Maps acompanha o modo escuro do app, não só o do sistema.
      userInterfaceStyle={esquema === 'escuro' ? 'dark' : 'light'}
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
