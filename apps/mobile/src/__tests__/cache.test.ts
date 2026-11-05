import { beforeEach, expect, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  avisoOffline,
  detalheParaGuardar,
  esquecerRecomendacoes,
  guardar,
  lembrarRecomendacoes,
  ler,
  limparTudo,
  quando,
  recomendacaoVista,
  recomendacoesParaGuardar,
} from '../offline/cache';
import type { Detalhe } from '../api/estabelecimentos';
import type { Recomendacao } from '../api/recomendacoes';

beforeEach(() => AsyncStorage.clear());

test('guarda e lê de volta com a hora em que foi salvo', async () => {
  await guardar('favoritos', [{ id_estab: 1 }]);
  const lido = await ler<{ id_estab: number }[]>('favoritos');
  expect(lido?.dados).toEqual([{ id_estab: 1 }]);
  expect(typeof lido?.salvoEm).toBe('number');
});

test('sem cópia guardada, devolve null', async () => {
  expect(await ler('nada')).toBeNull();
});

test('sair da conta apaga só a cópia offline', async () => {
  await guardar('favoritos', []);
  await AsyncStorage.setItem('tourlocal.aparencia', 'escuro');
  await limparTudo();
  expect(await ler('favoritos')).toBeNull();
  // A aparência é do aparelho, não da conta: continua.
  expect(await AsyncStorage.getItem('tourlocal.aparencia')).toBe('escuro');
});

test('"quando" mostra a hora para hoje e a data para outro dia', () => {
  const agora = new Date(2026, 9, 30, 15, 0);
  expect(quando(new Date(2026, 9, 30, 9, 5).getTime(), agora)).toBe('às 09:05');
  expect(quando(new Date(2026, 9, 28, 20, 0).getTime(), agora)).toBe('em 28/10');
  expect(avisoOffline(Date.now())).toMatch(/^Sem conexão\. Mostrando o que foi carregado às/);
});

test('lembra as recomendações vistas para explicar no detalhe', () => {
  lembrarRecomendacoes([{ id_estab: 7, motivos: ['Perto'] } as Recomendacao]);
  expect(recomendacaoVista(7)?.motivos).toEqual(['Perto']);
  esquecerRecomendacoes();
  expect(recomendacaoVista(7)).toBeUndefined();
});

test('a cópia offline não guarda nada sobre a posição da pessoa (RN10)', () => {
  const r = {
    id_estab: 1,
    distancia_km: 0.4,
    minutos_a_pe: 5,
    minutos_de_carro: 1,
    criterios: { proximidade: 0.9, avaliacao: 0.8, orcamento: 1, perfil: 0.5 },
    motivos: ['A 5 min a pé de você', 'Bem avaliado (nota 4,5)', 'A 0,4 km de você'],
  } as unknown as Recomendacao;
  const guardada = recomendacoesParaGuardar({ raio_km: 3, raio_sugerido_km: null, resultados: [r] })
    .resultados[0];
  expect(guardada.distancia_km).toBeNull();
  expect(guardada.minutos_a_pe).toBeNull();
  expect(guardada.minutos_de_carro).toBeNull();
  expect(guardada.criterios).toEqual({ avaliacao: 0.8, orcamento: 1, perfil: 0.5 });
  expect(guardada.motivos).toEqual(['Bem avaliado (nota 4,5)']);
  // O que está na tela agora continua completo.
  expect(r.distancia_km).toBe(0.4);

  const detalhe = detalheParaGuardar({ id_estab: 1, distancia_km: 0.4 } as unknown as Detalhe);
  expect(detalhe.distancia_km).toBeNull();
});
