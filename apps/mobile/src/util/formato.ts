export const PRECO = { economico: '$', moderado: '$$', alto: '$$$' } as const;

export function formatarDistancia(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`;
}

export function formatarNota(nota: number) {
  return nota.toFixed(1).replace('.', ',');
}

export type Preenchimento = 'cheia' | 'meia' | 'vazia';

/**
 * Como desenhar cada uma das 5 estrelas de uma nota média (RF13). A nota é arredondada para a
 * meia estrela mais próxima: 4,5 vira quatro estrelas e meia, e não cinco cheias como um 5,0.
 */
export function estrelasDaNota(nota: number): Preenchimento[] {
  return [1, 2, 3, 4, 5].map((posicao) => {
    const resto = nota - (posicao - 1);
    if (resto >= 0.75) return 'cheia';
    if (resto >= 0.25) return 'meia';
    return 'vazia';
  });
}
