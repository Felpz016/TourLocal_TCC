import { textoParaCompartilhar, linkDoMapa } from '../util/compartilhar';
import { formatarDistancia, formatarNota } from '../util/formato';
import { senhaForte } from '../util/senha';

describe('formato', () => {
  test('distância em metros abaixo de 1 km e com vírgula acima', () => {
    expect(formatarDistancia(0.25)).toBe('250 m');
    expect(formatarDistancia(2.84)).toBe('2,8 km');
  });

  test('nota com uma casa e vírgula', () => {
    expect(formatarNota(4.666)).toBe('4,7');
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
