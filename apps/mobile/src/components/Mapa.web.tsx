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

// Na web, o react-native-maps não funciona; usa o mapa embutido do OpenStreetMap,
// que marca só um ponto: o lugar em destaque ou a posição do usuário.
export function Mapa({ posicao, destaque, altura = 180 }: Props) {
  const centro: Ponto | null | undefined = destaque ?? posicao;
  if (!centro) return null;
  const d = destaque ? 0.004 : 0.01;
  const { latitude: lat, longitude: lon } = centro;
  const bbox = [lon - d, lat - d, lon + d, lat + d].join(',');
  const url = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
  return (
    <iframe
      title={destaque ? `Mapa de ${destaque.nome}` : 'Mapa com a sua posição'}
      src={url}
      style={{ width: '100%', height: altura, border: 0, display: 'block' }}
    />
  );
}
