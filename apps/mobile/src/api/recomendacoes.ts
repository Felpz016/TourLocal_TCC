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
  /** "Fecha às 23:00", "Abre às 18:00"... (null sem horário informado). */
  muda_as: string | null;
  opcoes_alimentares: string[];
  pontuacao: number;
  criterios: Record<'proximidade' | 'avaliacao' | 'orcamento' | 'perfil', number>;
  motivos: string[];
};

export type Recomendacoes = {
  raio_km: number;
  resultados: Recomendacao[];
  raio_sugerido_km: number | null;
};

export type Filtros = {
  categoria?: string | null;
  faixasPreco?: FaixaPreco[];
  notaMinima?: number | null;
  incluirFechados?: boolean;
};

export type Categoria = { nome: string; eixo: Eixo };

export function buscarRecomendacoes(params: {
  eixo: Eixo;
  lat: number;
  lng: number;
  raioKm?: number | null;
  filtros?: Filtros;
  /** Busca por nome, categoria ou endereço; sem raio, a API procura na cidade toda. */
  busca?: string;
}) {
  const { filtros = {} } = params;
  const query = new URLSearchParams({
    eixo: params.eixo,
    lat: String(params.lat),
    lng: String(params.lng),
    incluir_fechados: String(!!filtros.incluirFechados),
  });
  if (params.raioKm) query.set('raio_km', String(params.raioKm));
  if (params.busca) query.set('busca', params.busca);
  if (filtros.categoria) query.set('categoria', filtros.categoria);
  if (filtros.notaMinima) query.set('nota_minima', String(filtros.notaMinima));
  for (const faixa of filtros.faixasPreco ?? []) query.append('faixa_preco', faixa);
  return api<Recomendacoes>(`/recomendacoes?${query}`);
}

export function buscarCategorias(eixo: Eixo) {
  return api<Categoria[]>(`/categorias?eixo=${eixo}`);
}
