import type { Favorito } from '../api/estabelecimentos';

/**
 * Situação de um salvo com o mesmo texto do cartão da lista: "Aberto · Fecha às 23:00",
 * "Fechado · Abre às 18:00", "Aberto 24 horas". Sem horário cadastrado, não diz nada.
 */
export function situacaoDoSalvo(
  f: Pick<Favorito, 'aberto_agora' | 'muda_as' | 'fechado_temporariamente'>,
): { titulo: string; complemento: string | null; aberto: boolean } | null {
  if (f.fechado_temporariamente) {
    return { titulo: 'Fechado temporariamente', complemento: null, aberto: false };
  }
  if (f.aberto_agora === null || f.aberto_agora === undefined) return null;
  if (f.muda_as?.startsWith('Aberto')) {
    return { titulo: f.muda_as, complemento: null, aberto: true };
  }
  return {
    titulo: f.aberto_agora ? 'Aberto' : 'Fechado',
    complemento: f.muda_as,
    aberto: f.aberto_agora,
  };
}
