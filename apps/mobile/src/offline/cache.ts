import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Recomendacao } from '../api/recomendacoes';

// Modo offline: a última resposta de cada tela fica guardada no aparelho. Se a rede cair,
// a tela mostra essa cópia com um aviso em vez de ficar vazia. As chaves começam com o
// prefixo abaixo, para que sair da conta apague tudo de uma vez (nada fica para o próximo).
const PREFIXO = 'tourlocal.cache.';

export type Guardado<T> = { dados: T; salvoEm: number };

export async function guardar<T>(chave: string, dados: T): Promise<void> {
  const valor: Guardado<T> = { dados, salvoEm: Date.now() };
  try {
    await AsyncStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
  } catch {
    // Sem espaço ou sem armazenamento: o app só perde a cópia offline.
  }
}

export async function ler<T>(chave: string): Promise<Guardado<T> | null> {
  try {
    const texto = await AsyncStorage.getItem(PREFIXO + chave);
    return texto ? (JSON.parse(texto) as Guardado<T>) : null;
  } catch {
    return null;
  }
}

export async function limparTudo(): Promise<void> {
  try {
    const chaves = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(chaves.filter((c) => c.startsWith(PREFIXO)));
  } catch {
    // Nada a fazer: a próxima conta sobrescreve as chaves ao usar o app.
  }
}

/** "às 14:05" para hoje, "em 28/10" para outro dia. */
export function quando(salvoEm: number, agora = new Date()): string {
  const data = new Date(salvoEm);
  const doisDigitos = (n: number) => String(n).padStart(2, '0');
  if (data.toDateString() === agora.toDateString()) {
    return `às ${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
  }
  return `em ${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)}`;
}

export function avisoOffline(salvoEm: number): string {
  return `Sem conexão. Mostrando o que foi carregado ${quando(salvoEm)}.`;
}

// As recomendações vistas por último, por id, para a tela de detalhes explicar
// "por que recomendamos" sem precisar de outra chamada à API.
const recomendacoesVistas = new Map<number, Recomendacao>();

export function lembrarRecomendacoes(lista: Recomendacao[]) {
  for (const r of lista) recomendacoesVistas.set(r.id_estab, r);
}

export function recomendacaoVista(id: number): Recomendacao | undefined {
  return recomendacoesVistas.get(id);
}

export function esquecerRecomendacoes() {
  recomendacoesVistas.clear();
}
