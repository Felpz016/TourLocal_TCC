import { afterAll, beforeEach, describe, expect, test } from '@jest/globals';
import { cores, definirEsquema, tomDoLugar } from '../theme/cores';
import type { Esquema } from '../theme/cores';

// RNF11: contraste mínimo de 4,5:1 para texto e 3:1 para bordas (WCAG 2.1 AA), nos dois modos.
function luminancia(hex: string) {
  const canais = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = canais.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contraste(a: string, b: string) {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro! + 0.05) / (escuro! + 0.05);
}

const PARES_DE_TEXTO: [keyof typeof cores, keyof typeof cores][] = [
  ['texto', 'fundo'],
  ['texto', 'superficie'],
  ['textoSecundario', 'fundo'],
  ['textoSecundario', 'superficie'],
  ['primaria', 'superficie'],
  ['primariaTexto', 'primaria'],
  ['primariaEscura', 'fundoDestaque'],
  ['textoSobreTinta', 'tinta'],
  ['sol', 'tinta'],
  ['erro', 'superficie'],
  ['erro', 'fundoErro'],
  ['alerta', 'fundoAlerta'],
  ['sucesso', 'superficie'],
];

describe.each<Esquema>(['claro', 'escuro'])('paleta %s', (esquema) => {
  beforeEach(() => definirEsquema(esquema));
  afterAll(() => definirEsquema('claro'));

  test.each(PARES_DE_TEXTO)('%s sobre %s tem contraste de texto', (frente, fundo) => {
    expect(contraste(cores[frente], cores[fundo])).toBeGreaterThanOrEqual(4.5);
  });

  test('borda dos campos aparece sobre os cartões', () => {
    expect(contraste(cores.borda, cores.superficie)).toBeGreaterThanOrEqual(3);
  });

  test('selos das iniciais são legíveis', () => {
    for (const nome of ['Cantina', 'Café', 'Hotel', 'Museu', 'Parque', 'Bar']) {
      const tom = tomDoLugar(nome);
      expect(contraste(tom.letra, tom.fundo)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

test('cores mudam na hora em que o esquema muda', () => {
  definirEsquema('claro');
  const fundoClaro = cores.fundo;
  definirEsquema('escuro');
  expect(cores.fundo).not.toBe(fundoClaro);
  definirEsquema('claro');
  expect(cores.fundo).toBe(fundoClaro);
});
