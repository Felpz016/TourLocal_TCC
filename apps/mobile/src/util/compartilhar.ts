import { Share } from 'react-native';

import { PRECO, formatarNota } from './formato';

type LugarCompartilhado = {
  nome: string;
  categorias: string[];
  endereco: string;
  latitude: number;
  longitude: number;
  nota_media: number | null;
  total_avaliacoes: number;
  faixa_preco: keyof typeof PRECO | null;
};

/** Link do mapa que abre em qualquer celular (no iPhone, o Google Maps abre no Safari). */
export function linkDoMapa({ latitude, longitude }: { latitude: number; longitude: number }) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

/** Texto pronto para o WhatsApp: nome, resumo, endereço e o link do mapa. */
export function textoParaCompartilhar(lugar: LugarCompartilhado) {
  const resumo = [
    lugar.categorias.join(', '),
    lugar.nota_media !== null
      ? `★ ${formatarNota(lugar.nota_media)} (${lugar.total_avaliacoes} ${lugar.total_avaliacoes === 1 ? 'avaliação' : 'avaliações'})`
      : null,
    lugar.faixa_preco ? PRECO[lugar.faixa_preco] : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return [
    lugar.nome,
    resumo,
    `📍 ${lugar.endereco}`,
    linkDoMapa(lugar),
    '',
    'Encontrei no TourLocal',
  ]
    .filter((linha) => linha !== null && linha !== undefined)
    .join('\n');
}

export function compartilharLugar(lugar: LugarCompartilhado) {
  return Share.share({ title: lugar.nome, message: textoParaCompartilhar(lugar) });
}
