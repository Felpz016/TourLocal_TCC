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

// Cores dos selos com a inicial dos lugares sem foto; a mesma loja sempre ganha a mesma.
const SELOS = ['#245BFF', '#0B1B3A', '#163B9C', '#0E6E8C', '#4B4FD6', '#1C7C5C'];

export function corDoLugar(nome: string) {
  let soma = 0;
  for (const letra of nome) soma = (soma * 31 + letra.charCodeAt(0)) % 997;
  return SELOS[soma % SELOS.length]!;
}
