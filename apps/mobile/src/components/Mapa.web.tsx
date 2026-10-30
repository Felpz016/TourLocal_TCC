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
  margemInferior?: number;
};

// Na web, o react-native-maps não funciona; usa o mapa embutido do OpenStreetMap,
// que marca só um ponto: o lugar em destaque ou a posição do usuário. Como o iframe não
// aceita margem interna, ele encolhe até a parte que a lista não cobre.
export function Mapa({ posicao, destaque, altura = 180, margemInferior = 0 }: Props) {
  const { esquema } = useTema();
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
      style={{
        width: '100%',
        height: altura - margemInferior,
        border: 0,
        display: 'block',
        // O OpenStreetMap não tem tema escuro; inverter as cores e girar o matiz chega perto.
        filter:
          esquema === 'escuro' ? 'invert(0.9) hue-rotate(180deg) brightness(0.95)' : undefined,
      }}
    />
  );
}
