import { api } from './client';

export type Coordenadas = { latitude: number; longitude: number; endereco: string };

export function geocodificar(endereco: string) {
  return api<Coordenadas>(`/localizacao/geocodificar?endereco=${encodeURIComponent(endereco)}`);
}
