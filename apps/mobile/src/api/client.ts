import Constants from 'expo-constants';

/**
 * Endereço da API FastAPI.
 *
 * 1. EXPO_PUBLIC_API_URL no arquivo .env, se apontar para um endereço real (produção ou IP fixo).
 * 2. Em desenvolvimento no celular, o mesmo computador de onde o Expo Go baixou o app
 *    (hostUri, ex.: "172.20.10.2:8081"), na porta 8000. Assim não é preciso descobrir o IP.
 * 3. localhost, que só funciona no navegador ou emulador do próprio computador.
 */
function descobrirApiUrl(): string {
  const doEnv = process.env.EXPO_PUBLIC_API_URL;
  if (doEnv && !doEnv.includes('localhost')) return doEnv;
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (__DEV__ && host && host !== 'localhost') return `http://${host}:8000`;
  return doEnv ?? 'http://localhost:8000';
}

export const API_URL = descobrirApiUrl();

/** Erro devolvido pela API, com o status HTTP e a mensagem já pronta para exibir. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

let tokenAtual: string | null = null;
let aoExpirarSessao: (() => void) | null = null;

/** Chamado pelo AuthContext para que todas as requisições levem o token. */
export function definirToken(token: string | null) {
  tokenAtual = token;
}

/** Chamado pelo AuthContext para deslogar quando a API responder 401. */
export function definirAoExpirarSessao(callback: (() => void) | null) {
  aoExpirarSessao = callback;
}

function mensagemDeErro(status: number, corpo: unknown): string {
  const detail = (corpo as { detail?: unknown } | null)?.detail;
  if (typeof detail === 'string') return detail;
  // Erros de validação do FastAPI (422) vêm como lista. Os que a própria API escreveu (como a
  // regra de senha forte) chegam com o prefixo "Value error, " e são mostrados ao usuário.
  if (Array.isArray(detail) && detail[0]?.msg) {
    const msg = String(detail[0].msg);
    return msg.startsWith('Value error, ') ? msg.slice(13) : 'Confira os dados informados.';
  }
  if (status >= 500) return 'O servidor teve um problema. Tente de novo em instantes.';
  return 'Não deu certo agora. Tente de novo em instantes.';
}

// Sem resposta nesse tempo, a requisição é cancelada e o app mostra o erro em vez de ficar
// carregando para sempre (por exemplo, quando o firewall descarta a conexão sem recusar).
const TEMPO_LIMITE_MS = 15_000;

function semConexao(): ApiError {
  // Em desenvolvimento, mostra o endereço usado: ajuda a achar IP errado no .env.
  const dica = __DEV__ ? ` (${API_URL})` : '';
  return new ApiError(0, `Sem conexão com o servidor${dica}. Verifique sua internet.`);
}

export async function api<T>(
  caminho: string,
  opcoes: RequestInit = {},
  json = true,
  tempoLimiteMs = TEMPO_LIMITE_MS,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(opcoes.headers as Record<string, string>),
  };
  if (tokenAtual) headers.Authorization = `Bearer ${tokenAtual}`;

  const controle = new AbortController();
  const cronometro = setTimeout(() => controle.abort(), tempoLimiteMs);
  let resposta: Response;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      ...opcoes,
      headers,
      signal: controle.signal,
    });
  } catch {
    throw semConexao();
  } finally {
    clearTimeout(cronometro);
  }

  if (resposta.status === 204) return undefined as T;
  const corpo = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    if (resposta.status === 401 && tokenAtual) aoExpirarSessao?.();
    throw new ApiError(resposta.status, mensagemDeErro(resposta.status, corpo));
  }
  return corpo as T;
}

export async function verificarApi(): Promise<boolean> {
  const controle = new AbortController();
  const cronometro = setTimeout(() => controle.abort(), 5_000);
  try {
    const resposta = await fetch(`${API_URL}/health`, { signal: controle.signal });
    return resposta.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(cronometro);
  }
}
