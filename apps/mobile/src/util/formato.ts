export const PRECO = { economico: '$', moderado: '$$', alto: '$$$' } as const;

export function formatarDistancia(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`;
}

export function formatarNota(nota: number) {
  return nota.toFixed(1).replace('.', ',');
}

/**
 * Retorno do comerciante em Meus locais: nota, avaliações e quantos turistas salvaram o local.
 * Devolve os dois trechos que a tela mostra (cada um ao lado do seu ícone) e uma versão por
 * extenso para o leitor de tela.
 */
export function resumoDoLocal(local: {
  nota_media: number | null;
  total_avaliacoes: number;
  total_salvos: number;
}) {
  const { nota_media: nota, total_avaliacoes: total, total_salvos: salvos } = local;
  const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
  const avaliacoes = plural(total, 'avaliação', 'avaliações');
  const salvo =
    salvos === 0 ? 'Ninguém salvou ainda' : `Salvo por ${plural(salvos, 'pessoa', 'pessoas')}`;
  return {
    avaliacoes: nota === null ? 'Sem avaliações ainda' : `${formatarNota(nota)} · ${avaliacoes}`,
    salvos: salvo,
    rotulo: `${nota === null ? 'Sem avaliações ainda' : `Nota ${formatarNota(nota)} de 5, ${avaliacoes}`}. ${salvo}.`,
  };
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
