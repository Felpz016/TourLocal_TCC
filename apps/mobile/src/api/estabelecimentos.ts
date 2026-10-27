import { api } from './client';
import type { Eixo } from './recomendacoes';
import type { FaixaPreco } from './tipos';

export type Horario = { dia_semana: number; hora_abertura: string; hora_fechamento: string };

export type Avaliacao = {
  id_avaliacao: number;
  autor: string;
  nota: number;
  comentario: string | null;
  data_registro: string;
  minha: boolean;
};

export type Detalhe = {
  id_estab: number;
  nome: string;
  eixo: Eixo | null;
  categorias: string[];
  descricao: string | null;
  endereco: string;
  latitude: number;
  longitude: number;
  telefone: string | null;
  site: string | null;
  faixa_preco: FaixaPreco | null;
  acessibilidade: boolean;
  opcoes_alimentares: string[];
  horarios: Horario[];
  aberto_agora: boolean | null;
  fotos: { url: string; legenda: string | null }[];
  nota_media: number | null;
  total_avaliacoes: number;
  distancia_km: number | null;
  favorito: boolean;
  minha_avaliacao: Avaliacao | null;
};

export type Favorito = {
  id_estab: number;
  nome: string;
  categorias: string[];
  endereco: string;
  nota_media: number | null;
  data_inclusao: string;
};

export function buscarDetalhe(id: number, posicao?: { latitude: number; longitude: number }) {
  const query = posicao ? `?lat=${posicao.latitude}&lng=${posicao.longitude}` : '';
  return api<Detalhe>(`/estabelecimentos/${id}${query}`);
}

export function buscarAvaliacoes(id: number) {
  return api<Avaliacao[]>(`/estabelecimentos/${id}/avaliacoes`);
}

export function avaliar(id: number, nota: number, comentario: string) {
  return api<Avaliacao>(`/estabelecimentos/${id}/avaliacao`, {
    method: 'PUT',
    body: JSON.stringify({ nota, comentario }),
  });
}

export function excluirAvaliacao(id: number) {
  return api<void>(`/estabelecimentos/${id}/avaliacao`, { method: 'DELETE' });
}

export function denunciar(idAvaliacao: number) {
  return api<void>(`/avaliacoes/${idAvaliacao}/denuncia`, { method: 'POST' });
}

export function listarFavoritos() {
  return api<Favorito[]>('/favoritos');
}

export function definirFavorito(id: number, favorito: boolean) {
  return api<void>(`/favoritos/${id}`, { method: favorito ? 'PUT' : 'DELETE' });
}
