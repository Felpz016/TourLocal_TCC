import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';

import { api, ApiError, definirAoExpirarSessao, definirToken, verificarApi } from '../api/client';

// O cliente HTTP (src/api/client.ts) é por onde passam todos os pedidos do app. Estes testes
// trocam o fetch por um falso e conferem o que cada tela recebe: dados, erro ou logout.

type RespostaFalsa = { status: number; corpo?: unknown };

function responder({ status, corpo }: RespostaFalsa) {
  const semCorpo = corpo === undefined;
  return jest.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(semCorpo ? null : JSON.stringify(corpo), {
      status,
      headers: semCorpo ? {} : { 'Content-Type': 'application/json' },
    }),
  );
}

/** Faz o pedido e devolve o ApiError lançado (falha o teste se não houver erro). */
async function erroDe(pedido: Promise<unknown>): Promise<ApiError> {
  try {
    await pedido;
  } catch (e) {
    expect(e).toBeInstanceOf(ApiError);
    return e as ApiError;
  }
  throw new Error('O pedido deveria ter falhado.');
}

beforeEach(() => {
  definirToken(null);
  definirAoExpirarSessao(null);
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('respostas de sucesso', () => {
  test('devolve o JSON da API', async () => {
    responder({ status: 200, corpo: { nome: 'Café da Praça' } });
    await expect(api('/estabelecimentos/1')).resolves.toEqual({ nome: 'Café da Praça' });
  });

  test('204 (sem conteúdo) devolve undefined sem tentar ler o corpo', async () => {
    responder({ status: 204 });
    await expect(api('/favoritos/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  test('manda o token e o Content-Type JSON quando há sessão', async () => {
    const fetch = responder({ status: 200, corpo: {} });
    definirToken('abc123');
    await api('/perfil');
    const [url, opcoes] = fetch.mock.calls[0];
    expect(String(url)).toMatch(/\/perfil$/);
    expect(opcoes?.headers).toMatchObject({
      Authorization: 'Bearer abc123',
      'Content-Type': 'application/json',
    });
  });

  test('sem sessão não manda Authorization, e upload (json=false) não força Content-Type', async () => {
    const fetch = responder({ status: 200, corpo: {} });
    await api('/gestao/1/fotos', { method: 'POST' }, false);
    const cabecalhos = fetch.mock.calls[0][1]?.headers as Record<string, string>;
    expect(cabecalhos.Authorization).toBeUndefined();
    expect(cabecalhos['Content-Type']).toBeUndefined();
  });
});

describe('mensagens de erro', () => {
  test('usa o "detail" em texto que a API escreveu', async () => {
    responder({ status: 404, corpo: { detail: 'Estabelecimento não encontrado.' } });
    const erro = await erroDe(api('/estabelecimentos/999'));
    expect(erro.status).toBe(404);
    expect(erro.message).toBe('Estabelecimento não encontrado.');
  });

  test('422 de regra da API mostra a mensagem sem o prefixo "Value error, "', async () => {
    responder({
      status: 422,
      corpo: { detail: [{ msg: 'Value error, A senha precisa ter pelo menos 8 caracteres.' }] },
    });
    const erro = await erroDe(api('/auth/cadastro', { method: 'POST' }));
    expect(erro.message).toBe('A senha precisa ter pelo menos 8 caracteres.');
  });

  test('422 de validação genérica do FastAPI vira um texto amigável', async () => {
    responder({ status: 422, corpo: { detail: [{ msg: 'Field required' }] } });
    const erro = await erroDe(api('/auth/cadastro', { method: 'POST' }));
    expect(erro.message).toBe('Confira os dados informados.');
  });

  test('erro 500 sem corpo JSON avisa que o problema é no servidor', async () => {
    responder({ status: 500 });
    const erro = await erroDe(api('/recomendacoes'));
    expect(erro.status).toBe(500);
    expect(erro.message).toBe('O servidor teve um problema. Tente de novo em instantes.');
  });

  test('erro 4xx sem "detail" usa a mensagem padrão', async () => {
    responder({ status: 400, corpo: {} });
    const erro = await erroDe(api('/recomendacoes'));
    expect(erro.message).toBe('Não deu certo agora. Tente de novo em instantes.');
  });
});

describe('sessão expirada (401)', () => {
  test('com sessão aberta, avisa o AuthContext para deslogar', async () => {
    const aoExpirar = jest.fn();
    definirAoExpirarSessao(aoExpirar);
    definirToken('token-vencido');
    responder({ status: 401, corpo: { detail: 'Sessão expirada.' } });
    const erro = await erroDe(api('/perfil'));
    expect(erro.status).toBe(401);
    expect(aoExpirar).toHaveBeenCalledTimes(1);
  });

  test('sem sessão (senha errada no login) não desloga ninguém', async () => {
    const aoExpirar = jest.fn();
    definirAoExpirarSessao(aoExpirar);
    responder({ status: 401, corpo: { detail: 'E-mail ou senha incorretos.' } });
    const erro = await erroDe(api('/auth/login', { method: 'POST' }));
    expect(erro.message).toBe('E-mail ou senha incorretos.');
    expect(aoExpirar).not.toHaveBeenCalled();
  });
});

describe('sem conexão', () => {
  test('falha de rede vira ApiError com status 0 e mensagem de internet', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network request failed'));
    const erro = await erroDe(api('/recomendacoes'));
    expect(erro.status).toBe(0);
    expect(erro.message).toMatch(/^Sem conexão com o servidor.*Verifique sua internet\.$/);
  });

  test('cancela o pedido quando passa do tempo limite', async () => {
    jest.useFakeTimers();
    // Um servidor que nunca responde: o pedido só termina quando o AbortController cancela.
    jest.spyOn(globalThis, 'fetch').mockImplementation(
      (_url, opcoes) =>
        new Promise((_resolve, rejeitar) => {
          opcoes?.signal?.addEventListener('abort', () => rejeitar(new Error('aborted')));
        }),
    );
    const pedido = erroDe(api('/recomendacoes', {}, true, 1_000));
    jest.advanceTimersByTime(1_000);
    const erro = await pedido;
    expect(erro.status).toBe(0);
    expect(erro.message).toMatch(/^Sem conexão/);
  });
});

describe('verificarApi', () => {
  test('true quando /health responde', async () => {
    const fetch = responder({ status: 200, corpo: { status: 'ok' } });
    await expect(verificarApi()).resolves.toBe(true);
    expect(String(fetch.mock.calls[0][0])).toMatch(/\/health$/);
  });

  test('false quando a API responde com erro ou está fora do ar', async () => {
    responder({ status: 503 });
    await expect(verificarApi()).resolves.toBe(false);
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network request failed'));
    await expect(verificarApi()).resolves.toBe(false);
  });
});
