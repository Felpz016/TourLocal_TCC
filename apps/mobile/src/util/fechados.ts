/**
 * Texto do estado vazio quando a lista só ficou vazia porque tudo por perto está fechado
 * agora (RN02). A API conta esses lugares em `total_fechados`; a tela oferece "Ver os
 * fechados" em vez de só ampliar o raio, que à noite costuma trazer o mesmo vazio.
 */
export function textoTudoFechado(totalFechados: number, raio: string): string | null {
  if (totalFechados <= 0) return null;
  return totalFechados === 1
    ? `1 lugar num raio de ${raio} está fechado agora. Veja quando ele abre.`
    : `${totalFechados} lugares num raio de ${raio} estão fechados agora. Veja quando cada um abre.`;
}
