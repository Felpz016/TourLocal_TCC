import { describe, expect, test } from '@jest/globals';
import { completarHora, horaValida, mascararHora } from '../util/hora';

// O teclado numérico do iPhone não tem ":", então o campo de hora precisa funcionar
// digitando só números (RF16, RNF11).
describe('campo de hora sem dois-pontos', () => {
  test.each([
    ['0', '0'],
    ['08', '08'],
    ['083', '08:3'],
    ['0830', '08:30'],
    ['8', '08'],
    ['830', '08:30'],
    ['8:30', '08:30'],
    ['2359', '23:59'],
    ['12345', '12:34'],
    ['08:300', '08:30'],
    ['', ''],
  ])('digitar "%s" mostra "%s"', (digitado, esperado) => {
    expect(mascararHora(digitado)).toBe(esperado);
  });

  test('apagar não trava no ":"', () => {
    // Apagar o último dígito de "09:00" deixa "09:0", depois "09:", que vira "09".
    expect(mascararHora('09:0')).toBe('09:0');
    expect(mascararHora('09:')).toBe('09');
    expect(mascararHora('0')).toBe('0');
  });

  test.each([
    ['9', '09:00'],
    ['18', '18:00'],
    ['13:0', '13:00'],
    ['08:3', '08:30'],
    ['0830', '08:30'],
    ['08:30', '08:30'],
    ['', ''],
  ])('ao sair do campo, "%s" vira "%s"', (digitado, esperado) => {
    expect(completarHora(digitado)).toBe(esperado);
  });

  test('só aceita horas que existem', () => {
    expect(horaValida('08:30')).toBe('08:30');
    expect(horaValida('9')).toBe('09:00');
    expect(horaValida('2400')).toBeNull();
    expect(horaValida('12:60')).toBeNull();
    expect(horaValida('')).toBeNull();
  });
});
