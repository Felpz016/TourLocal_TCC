import { describe, expect, test } from '@jest/globals';
import { situacaoDoSalvo } from '../util/situacao';

describe('situação dos salvos', () => {
  test('aberto mostra quando fecha', () => {
    expect(
      situacaoDoSalvo({
        aberto_agora: true,
        muda_as: 'Fecha às 02:00',
        fechado_temporariamente: false,
      }),
    ).toEqual({ titulo: 'Aberto', complemento: 'Fecha às 02:00', aberto: true });
  });

  test('fechado mostra quando abre', () => {
    expect(
      situacaoDoSalvo({
        aberto_agora: false,
        muda_as: 'Abre amanhã às 07:00',
        fechado_temporariamente: false,
      }),
    ).toEqual({ titulo: 'Fechado', complemento: 'Abre amanhã às 07:00', aberto: false });
  });

  test('"Aberto 24 horas" já diz tudo sozinho', () => {
    expect(
      situacaoDoSalvo({
        aberto_agora: true,
        muda_as: 'Aberto 24 horas',
        fechado_temporariamente: false,
      }),
    ).toEqual({ titulo: 'Aberto 24 horas', complemento: null, aberto: true });
  });

  test('fechado temporariamente não promete reabertura', () => {
    expect(
      situacaoDoSalvo({ aberto_agora: false, muda_as: null, fechado_temporariamente: true }),
    ).toEqual({ titulo: 'Fechado temporariamente', complemento: null, aberto: false });
  });

  test('sem horário cadastrado não mostra nada', () => {
    expect(
      situacaoDoSalvo({ aberto_agora: null, muda_as: null, fechado_temporariamente: false }),
    ).toBeNull();
  });
});
