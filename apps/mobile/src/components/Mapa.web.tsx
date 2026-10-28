import type { Recomendacao } from '../api/recomendacoes';
import type { Posicao } from '../localizacao/LocalizacaoContext';

type Props = { posicao: Posicao; lugares?: Recomendacao[]; altura?: number };

// Na web, o react-native-maps não funciona; usa o mapa embutido do OpenStreetMap,
// que mostra só a posição do usuário (os lugares aparecem na lista).
export function Mapa({ posicao, altura = 180 }: Props) {
  const d = 0.01;
  const { latitude: lat, longitude: lon } = posicao;
  const bbox = [lon - d, lat - d, lon + d, lat + d].join(',');
  const url = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
  return (
    <iframe
      title="Mapa com a sua posição"
      src={url}
      style={{ width: '100%', height: altura, border: 0, display: 'block' }}
    />
  );
}
