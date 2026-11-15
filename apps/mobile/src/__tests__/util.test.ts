import { describe, expect, test } from '@jest/globals';
import { textoParaCompartilhar, linkDoMapa } from '../util/compartilhar';
import { estrelasDaNota, formatarDistancia, formatarNota, resumoDoLocal } from '../util/formato';
import { senhaForte } from '../util/senha';

describe('formato', () => {
  test('distância em metros abaixo de 1 km e com vírgula acima', () => {
    expect(formatarDistancia(0.25)).toBe('250 m');
    expect(formatarDistancia(2.84)).toBe('2,8 km');
  });

  test('nota com uma casa e vírgula', () => {
    expect(formatarNota(4.666)).toBe('4,7');
  });

  test.each([
    [5, ['cheia', 'cheia', 'cheia', 'cheia', 'cheia']],
    [4.5, ['cheia', 'cheia', 'cheia', 'cheia', 'meia']],
    [4.8, ['cheia', 'cheia', 'cheia', 'cheia', 'cheia']],
    [4.2, ['cheia', 'cheia', 'cheia', 'cheia', 'vazia']],
    [3.5, ['cheia', 'cheia', 'cheia', 'meia', 'vazia']],
    [1, ['cheia', 'vazia', 'vazia', 'vazia', 'vazia']],
  ])('nota %p vira meia estrela em vez de arredondar para cima', (nota, esperado) => {
    expect(estrelasDaNota(nota)).toEqual(esperado);
  });
});

describe('senha forte (mesma regra da API)', () => {
  test.each([
    ['Demo@2026', true],
    ['curta@A1', true],
    ['semespecial1A', false],
    ['SEM@MINUSCULA', false],
    ['sem@maiuscula', false],
    ['Ab@1', false],
  ])('%s → %s', (senha, esperado) => {
    expect(senhaForte(senha)).toBe(esperado);
  });
});

describe('compartilhar', () => {
  const lugar = {
    nome: 'Cantina Nonna Lúcia',
    categorias: ['Restaurante'],
    endereco: 'Rua São Bento, 820 - Centro',
    latitude: -21.7926,
    longitude: -48.1746,
    nota_media: 4.666,
    total_avaliacoes: 3,
    faixa_preco: 'moderado' as const,
  };

  test('texto tem nome, resumo, endereço e link do mapa', () => {
    expect(textoParaCompartilhar(lugar).split('\n')).toEqual([
      'Cantina Nonna Lúcia',
      'Restaurante · ★ 4,7 (3 avaliações) · $$',
      '📍 Rua São Bento, 820 - Centro',
      'https://www.google.com/maps/search/?api=1&query=-21.7926,-48.1746',
      '',
      'Encontrei no TourLocal',
    ]);
  });

  test('sem avaliações, o resumo não fala de nota', () => {
    const texto = textoParaCompartilhar({ ...lugar, nota_media: null, total_avaliacoes: 0 });
    expect(texto).toContain('Restaurante · $$');
    expect(texto).not.toContain('★');
  });

  test('link do mapa usa as coordenadas', () => {
    expect(linkDoMapa({ latitude: 1, longitude: 2 })).toMatch(/query=1,2$/);
  });
});

describe('resumo do local para o comerciante', () => {
  test('mostra nota, avaliações e quem salvou', () => {
    expect(resumoDoLocal({ nota_media: 4.7, total_avaliacoes: 12, total_salvos: 8 })).toEqual({
      avaliacoes: '4,7 · 12 avaliações',
      salvos: 'Salvo por 8 pessoas',
      rotulo: 'Nota 4,7 de 5, 12 avaliações. Salvo por 8 pessoas.',
    });
  });

  test('usa o singular e explica quando ainda não há nada', () => {
    const um = resumoDoLocal({ nota_media: 5, total_avaliacoes: 1, total_salvos: 1 });
    expect([um.avaliacoes, um.salvos]).toEqual(['5,0 · 1 avaliação', 'Salvo por 1 pessoa']);
    expect(resumoDoLocal({ nota_media: null, total_avaliacoes: 0, total_salvos: 0 })).toEqual({
      avaliacoes: 'Sem avaliações ainda',
      salvos: 'Ninguém salvou ainda',
      rotulo: 'Sem avaliações ainda. Ninguém salvou ainda.',
    });
  });
});
