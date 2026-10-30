// Paleta "mapa de viagem": azul-oceano sobre papel areia, com azul-marinho para
// superfícies escuras e amarelo-sol só nos destaques. Os pares de texto passam de
// 4,5:1 (RNF11): branco sobre `primaria` dá 5,2:1 e `textoSecundario` sobre areia, 5,3:1.
const claro = {
  primaria: '#245BFF',
  primariaEscura: '#163B9C',
  primariaTexto: '#FFFFFF',
  tinta: '#0B1B3A',
  // Texto sobre `tinta` (cartão do perfil, chips ativos, tela de entrada).
  textoSobreTinta: '#FFFFFF',
  sol: '#FFC83D',
  texto: '#0B1B3A',
  textoSecundario: '#5E6472',
  // Borda de campos e chips (3:1 sobre o branco e sobre a areia, conferido em
  // src/__tests__/cores.test.ts); `divisoria` é só para separar cartões.
  borda: '#928C7E',
  divisoria: '#E8E3D9',
  erro: '#C8261A',
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
  // Cor das sombras e do "brilho" dos esqueletos de carregamento.
  sombra: 'rgba(11, 27, 58, 0.16)',
  esqueleto: '#E9E5DC',
};

export type Paleta = typeof claro;

// Modo escuro: o mar à noite. O fundo é um azul-marinho quase preto (não cinza), os
// cartões sobem um tom e o azul fica mais claro para continuar legível; por isso o texto
// sobre ele passa a ser marinho. Todos os pares de texto continuam acima de 4,5:1.
const escuro: Paleta = {
  primaria: '#7FA2FF',
  primariaEscura: '#B9CBFF',
  primariaTexto: '#0B1B3A',
  tinta: '#22345E',
  textoSobreTinta: '#FFFFFF',
  sol: '#FFC83D',
  texto: '#EEF1F7',
  textoSecundario: '#A3ACBF',
  borda: '#5E6A85',
  divisoria: '#253049',
  erro: '#FF7A6E',
  fundoErro: '#3B1D1F',
  alerta: '#FFC46B',
  fundoAlerta: '#3A2B10',
  sucesso: '#4ADE9B',
  fundo: '#0B1220',
  superficie: '#141D31',
  fundoCampo: '#1A2439',
  estrela: '#FFB547',
  favorito: '#FF5C86',
  fundoDestaque: '#1E2C52',
  sombra: 'rgba(0, 0, 0, 0.5)',
  esqueleto: '#1F2940',
};

export type Esquema = 'claro' | 'escuro';
const PALETAS: Record<Esquema, Paleta> = { claro, escuro };

let esquemaAtual: Esquema = 'claro';

/** Chamado só pelo TemaProvider (theme/tema.tsx), antes de desenhar as telas. */
export function definirEsquema(esquema: Esquema) {
  esquemaAtual = esquema;
}

export function lerEsquema(): Esquema {
  return esquemaAtual;
}

/**
 * Cores do esquema atual. Cada propriedade é lida na hora, então `cores.texto` já devolve a
 * cor do modo escuro quando ele está ligado. Os estilos das telas são criados com
 * `criarEstilos` (theme/tema.tsx), que refaz o StyleSheet quando o esquema muda.
 */
export const cores = {} as Paleta;
for (const chave of Object.keys(claro) as (keyof Paleta)[]) {
  Object.defineProperty(cores, chave, {
    enumerable: true,
    get: () => PALETAS[esquemaAtual][chave],
  });
}

// Tons dos selos com a inicial dos lugares sem foto: fundo claro e letra escura, como os
// avatares de contato do iOS (no escuro, o contrário). A mesma loja sempre ganha o mesmo tom.
const SELOS: Record<Esquema, { fundo: string; letra: string }[]> = {
  claro: [
    { fundo: '#E8EEFF', letra: '#1D4ED8' },
    { fundo: '#E2F1F6', letra: '#0E6E8C' },
    { fundo: '#E4F3EC', letra: '#1C7C5C' },
    { fundo: '#ECEBFF', letra: '#4B4FD6' },
    { fundo: '#FFF1D6', letra: '#8A4B00' },
    { fundo: '#E7EAF0', letra: '#0B1B3A' },
  ],
  escuro: [
    { fundo: '#1E2C52', letra: '#A9C0FF' },
    { fundo: '#13323D', letra: '#8FD3EA' },
    { fundo: '#153328', letra: '#8EDDBB' },
    { fundo: '#25254F', letra: '#B8B9FF' },
    { fundo: '#3A2B10', letra: '#FFC46B' },
    { fundo: '#232C3F', letra: '#DDE3EE' },
  ],
};

export function tomDoLugar(nome: string) {
  let soma = 0;
  for (const letra of nome) soma = (soma * 31 + letra.charCodeAt(0)) % 997;
  const tons = SELOS[esquemaAtual];
  return tons[soma % tons.length]!;
}
