import { Linking, Platform } from 'react-native';

type Destino = { latitude: number; longitude: number; nome: string };

/**
 * Link de rota até o local (RF12). No iPhone abre o Apple Maps; no Android e na web,
 * o Google Maps, que o sistema entrega ao app instalado ou ao navegador.
 */
export function urlRota({ latitude, longitude, nome }: Destino) {
  const destino = `${latitude},${longitude}`;
  if (Platform.OS === 'ios') {
    return `http://maps.apple.com/?daddr=${destino}&q=${encodeURIComponent(nome)}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${destino}`;
}

export function abrirRota(destino: Destino) {
  return Linking.openURL(urlRota(destino));
}
