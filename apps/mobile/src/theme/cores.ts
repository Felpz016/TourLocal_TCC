// Paleta "mapa de viagem": azul-oceano sobre papel areia, com azul-marinho para
// superfícies escuras e amarelo-sol só nos destaques. Os pares de texto passam de
// 4,5:1 (RNF11): branco sobre `primaria` dá 5,2:1 e `textoSecundario` sobre areia, 5,3:1.
export const cores = {
  primaria: '#245BFF',
  primariaEscura: '#163B9C',
  primariaTexto: '#FFFFFF',
  tinta: '#0B1B3A',
  sol: '#FFC83D',
  texto: '#0B1B3A',
  textoSecundario: '#5E6472',
  // Borda de campos e chips (3:1 sobre branco); `divisoria` é só para separar cartões.
  borda: '#C9C3B6',
  divisoria: '#E8E3D9',
  erro: '#D92D20',
  fundoErro: '#FDECEA',
  alerta: '#8A4B00',
  fundoAlerta: '#FFF3D6',
  sucesso: '#067647',
  // Fundo das telas (papel areia); cartões e campos ficam em `superficie` por cima.
  fundo: '#F5F3EE',
  superficie: '#FFFFFF',
  fundoCampo: '#FBFAF7',
  // Âmbar escuro: as estrelas também precisam de contraste sobre o fundo branco.
  estrela: '#B45309',
  favorito: '#E11D48',
  fundoDestaque: '#E8EEFF',
};

// Tons dos selos com a inicial dos lugares sem foto: fundo claro e letra escura, como os
// avatares de contato do iOS. A mesma loja sempre ganha o mesmo tom.
const SELOS = [
  { fundo: '#E8EEFF', letra: '#1D4ED8' },
  { fundo: '#E2F1F6', letra: '#0E6E8C' },
  { fundo: '#E4F3EC', letra: '#1C7C5C' },
  { fundo: '#ECEBFF', letra: '#4B4FD6' },
  { fundo: '#FFF1D6', letra: '#8A4B00' },
  { fundo: '#E7EAF0', letra: '#0B1B3A' },
];

export function tomDoLugar(nome: string) {
  let soma = 0;
  for (const letra of nome) soma = (soma * 31 + letra.charCodeAt(0)) % 997;
  return SELOS[soma % SELOS.length]!;
}
