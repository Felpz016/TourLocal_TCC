import { Platform } from 'react-native';

import { API_URL, api } from './client';
import type { FaixaPreco } from './tipos';

export type HorarioIn = { dia_semana: number; hora_abertura: string; hora_fechamento: string };

export type EstabelecimentoIn = {
  nome: string;
  descricao: string;
  endereco: string;
  latitude: number;
  longitude: number;
  categorias: string[];
  faixa_preco: FaixaPreco | null;
  acessibilidade: boolean;
  opcoes_alimentares: string[];
  telefone: string;
  site: string;
  horarios: HorarioIn[];
  fechado_temporariamente: boolean;
};

export type MeuEstabelecimento = {
  id_estab: number;
  nome: string;
  endereco: string;
  categorias: string[];
  verificado: boolean;
  fechado_temporariamente: boolean;
  total_fotos: number;
};

export type Pendente = {
  id_estab: number;
  nome: string;
  endereco: string;
  categorias: string[];
  responsavel: string | null;
  email_responsavel: string | null;
};

export type Denuncia = {
  id_avaliacao: number;
  id_estab: number;
  estabelecimento: string;
  autor: string;
  nota: number;
  comentario: string | null;
  data_registro: string;
};

type Salvo = { id_estab: number; verificado: boolean };

/** Fotos enviadas pelo comerciante vêm com caminho relativo ("/uploads/..."). */
export function urlFoto(url: string) {
  return url.startsWith('/') ? `${API_URL}${url}` : url;
}

export function listarMeus() {
  return api<MeuEstabelecimento[]>('/meus-estabelecimentos');
}

export function cadastrar(dados: EstabelecimentoIn) {
  return api<Salvo>('/estabelecimentos', { method: 'POST', body: JSON.stringify(dados) });
}

export function atualizar(id: number, dados: EstabelecimentoIn) {
  return api<Salvo>(`/estabelecimentos/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
}

/** Envia a foto como multipart/form-data (RF17). */
export async function enviarFoto(id: number, foto: { uri: string; mimeType?: string | null }) {
  const form = new FormData();
  const tipo = foto.mimeType ?? 'image/jpeg';
  if (Platform.OS === 'web') {
    // Na web, a URI é um blob: o arquivo precisa ser lido antes de ir no formulário.
    form.append('arquivo', await (await fetch(foto.uri)).blob(), 'foto');
  } else {
    // No celular, o React Native lê o arquivo a partir da URI.
    form.append('arquivo', { uri: foto.uri, name: 'foto', type: tipo } as unknown as Blob);
  }
  // Sem Content-Type manual: o fetch monta o cabeçalho com o "boundary" do multipart.
  return api<{ id_foto: number; url: string }>(
    `/estabelecimentos/${id}/fotos`,
    { method: 'POST', body: form, headers: {} },
    false,
    60_000, // fotos grandes em rede móvel demoram mais
  );
}

export function removerFoto(idFoto: number) {
  return api<void>(`/fotos/${idFoto}`, { method: 'DELETE' });
}

export function listarPendentes() {
  return api<Pendente[]>('/admin/estabelecimentos/pendentes');
}

export function aprovar(id: number) {
  return api<void>(`/admin/estabelecimentos/${id}/aprovar`, { method: 'POST' });
}

export function rejeitar(id: number) {
  return api<void>(`/admin/estabelecimentos/${id}`, { method: 'DELETE' });
}

export function listarDenunciadas() {
  return api<Denuncia[]>('/admin/avaliacoes/denunciadas');
}

export function decidirDenuncia(idAvaliacao: number, manter: boolean) {
  return api<void>(`/admin/avaliacoes/${idAvaliacao}/decisao`, {
    method: 'POST',
    body: JSON.stringify({ manter }),
  });
}
