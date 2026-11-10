/**
 * Modo demonstração da versão web publicada (GitHub Pages).
 *
 * O link público não tem servidor: o Pyodide (Python em WebAssembly) roda o próprio código da
 * API FastAPI dentro do navegador, com um banco SQLite em memória já preenchido com os lugares
 * e as contas de demonstração (api/app/navegador.py). Cada pedido do app passa pelas mesmas
 * rotas e regras da API real, só que sem rede. Cada visitante tem a sua cópia dos dados, que
 * volta ao estado inicial quando a página é recarregada.
 *
 * Ligado só no build da demonstração (EXPO_PUBLIC_MODO_DEMO=1, ver .github/workflows/demo-web.yml).
 */

export const MODO_DEMO = process.env.EXPO_PUBLIC_MODO_DEMO === '1';

/** Senha das contas de demonstração (api/app/demo.py). */
export const SENHA_DEMO = 'Demo@2026';
export const CONTAS_DEMO = [
  { tipo: 'Turista', email: 'turista@demo.tourlocal.app' },
  { tipo: 'Comerciante', email: 'comerciante@demo.tourlocal.app' },
  { tipo: 'Administrador', email: 'admin@demo.tourlocal.app' },
] as const;

/** Centro de Araraquara, onde ficam os lugares de demonstração (mesmo ponto de app/demo.py). */
export const POSICAO_DEMO = {
  latitude: -21.7946,
  longitude: -48.1756,
  endereco: 'Centro de Araraquara',
};

// Caminho onde o site foi publicado (ex.: "/TourLocal_TCC" no GitHub Pages).
const BASE = (process.env.EXPO_PUBLIC_BASE_URL ?? '').replace(/\/$/, '');

// Objetos do Pyodide (carregado em tempo de execução) não têm tipos aqui.
type ApiNoNavegador = { py: any; navegador: any };
let carregamento: Promise<ApiNoNavegador> | null = null;
let pronta: ApiNoNavegador | null = null;

function carregarScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
    document.head.appendChild(script);
  });
}

async function carregar(): Promise<ApiNoNavegador> {
  const pasta = `${window.location.origin}${BASE}/pyodide/`;
  await carregarScript(`${pasta}pyodide.js`);
  const py = await (globalThis as any).loadPyodide({ indexURL: pasta });
  const pacotes: string[] = await (await fetch(`${pasta}pacotes.json`)).json();
  await py.loadPackage(pacotes, { messageCallback: () => {} });
  const codigo = await (await fetch(`${pasta}api.zip`)).arrayBuffer();
  py.unpackArchive(codigo, 'zip', { extractDir: '/home/pyodide/api' });
  py.runPython("import sys; sys.path.insert(0, '/home/pyodide/api')");
  pronta = { py, navegador: py.pyimport('app.navegador') };
  return pronta;
}

/** Começa a carregar a API no navegador (leva alguns segundos na primeira vez). */
export function iniciarDemo(): Promise<ApiNoNavegador> {
  if (!carregamento) {
    carregamento = carregar().catch((erro) => {
      carregamento = null; // deixa tentar de novo no próximo pedido
      throw erro;
    });
  }
  return carregamento;
}

/** Faz o pedido na API que roda no navegador e devolve uma Response, como o fetch faria. */
export async function pedirNaDemo(caminho: string, opcoes: RequestInit): Promise<Response> {
  const { navegador } = await iniciarDemo();
  const cabecalhos = new Headers(opcoes.headers);
  let corpo: Uint8Array | null = null;
  if (typeof opcoes.body === 'string') {
    corpo = new TextEncoder().encode(opcoes.body);
  } else if (opcoes.body instanceof FormData) {
    // Fotos (multipart): o próprio navegador monta o corpo e o "boundary".
    const montado = new Request('https://demo.tourlocal/', { method: 'POST', body: opcoes.body });
    cabecalhos.set('content-type', montado.headers.get('content-type') ?? '');
    corpo = new Uint8Array(await montado.arrayBuffer());
  }
  const resultado = await navegador.responder(
    opcoes.method ?? 'GET',
    caminho,
    JSON.stringify(Object.fromEntries(cabecalhos.entries())),
    corpo,
  );
  const [status, cabecalhosResposta, bytes] = resultado.toJs();
  resultado.destroy();
  const semCorpo = status === 204 || status === 304;
  return new Response(semCorpo ? null : bytes, {
    status,
    headers: JSON.parse(cabecalhosResposta),
  });
}

const fotosEmBlob = new Map<string, string>();

/** Fotos enviadas na demonstração ficam no disco virtual do Pyodide; viram um endereço blob:. */
export function urlFotoDemo(url: string): string {
  if (!pronta) return url;
  const existente = fotosEmBlob.get(url);
  if (existente) return existente;
  try {
    const bytes: Uint8Array = pronta.py.FS.readFile(`/tmp${url}`);
    const blob = URL.createObjectURL(new Blob([bytes as BlobPart]));
    fotosEmBlob.set(url, blob);
    return blob;
  } catch {
    return url;
  }
}
