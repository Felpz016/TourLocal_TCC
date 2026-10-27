import { api } from './client';
import type { FaixaPreco } from './tipos';

export type Eixo = 'comer' | 'ficar' | 'fazer';

export type Recomendacao = {
  id_estab: number;
  nome: string;
  eixo: Eixo;
  categorias: string[];
  endereco: string;
  latitude: number;
  longitude: number;
  faixa_preco: FaixaPreco | null;
  acessibilidade: boolean;
  nota_media: number | null;
  total_avaliacoes: number;
  foto_url: string | null;
  distancia_km: number;
  minutos_a_pe: number;
  minutos_de_carro: number;
  aberto_agora: boolean | null;
};

export type Recomendacoes = { raio_km: number; resultados: Recomendacao[] };

export function buscarRecomendacoes(params: {
  eixo: Eixo;
  lat: number;
  lng: number;
  incluirFechados?: boolean;
}) {
  const query = new URLSearchParams({
    eixo: params.eixo,
    lat: String(params.lat),
    lng: String(params.lng),
    incluir_fechados: String(!!params.incluirFechados),
  });
  return api<Recomendacoes>(`/recomendacoes?${query}`);
}
