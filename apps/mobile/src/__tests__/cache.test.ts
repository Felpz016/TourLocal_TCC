import { beforeEach, expect, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  avisoOffline,
  esquecerRecomendacoes,
  guardar,
  lembrarRecomendacoes,
  ler,
  limparTudo,
  quando,
  recomendacaoVista,
} from '../offline/cache';
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
