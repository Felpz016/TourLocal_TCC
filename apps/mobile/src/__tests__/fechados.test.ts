import { expect, test } from '@jest/globals';
import { textoTudoFechado } from '../util/fechados';

test('sem lugares fechados por perto, não há texto (fica o "Nenhum lugar por perto")', () => {
  expect(textoTudoFechado(0, '3 km')).toBeNull();
});

test('conta os fechados no singular e no plural', () => {
  expect(textoTudoFechado(1, '3 km')).toBe(
    '1 lugar num raio de 3 km está fechado agora. Veja quando ele abre.',
  );
  expect(textoTudoFechado(6, '1,5 km')).toBe(
    '6 lugares num raio de 1,5 km estão fechados agora. Veja quando cada um abre.',
  );
});
