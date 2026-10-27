// Endereço da API FastAPI. No celular físico, troque localhost pelo IP do computador
// (ex.: EXPO_PUBLIC_API_URL=http://192.168.0.10:8000 no arquivo .env).
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

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
  // Erros de validação do FastAPI (422) vêm como lista.
  if (Array.isArray(detail) && detail[0]?.msg) return 'Confira os dados informados.';
  if (status >= 500) return 'O servidor teve um problema. Tente novamente.';
  return 'Não foi possível concluir a operação.';
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
