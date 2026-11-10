// Prepara a API para rodar dentro do navegador na demonstração web (GitHub Pages).
//
// Usa a distribuição completa do Pyodide (Python em WebAssembly) para instalar as dependências
// da API, copia só os pacotes usados para <saida>/pyodide, compacta o código da API em
// api.zip e, no fim, sobe essa cópia do zero e faz login e uma recomendação para conferir.
//
//   node scripts/demo-web/preparar-api.mjs <pasta-do-pyodide-completo> <saida>
//
// A pasta do Pyodide vem do arquivo pyodide-<versão>.tar.bz2 das releases do projeto
// (o workflow .github/workflows/demo-web.yml baixa e guarda em cache).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const [pyodideDir, saida] = process.argv.slice(2).map((p) => p && path.resolve(p));
if (!pyodideDir || !saida) {
  console.error('Uso: node preparar-api.mjs <pasta-do-pyodide-completo> <saida>');
  process.exit(1);
}
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const destino = path.join(saida, 'pyodide');
fs.rmSync(destino, { recursive: true, force: true });
fs.mkdirSync(destino, { recursive: true });

// Mesmas versões do servidor, menos o que só existe lá: servidor HTTP, migrações e MySQL.
const SO_NO_SERVIDOR = ['uvicorn', 'alembic', 'pymysql', 'cryptography'];
const requisitos = fs
  .readFileSync(path.join(raiz, 'api/requirements.txt'), 'utf8')
  .split('\n')
  .map((linha) => linha.split('#')[0].trim())
  .filter(Boolean)
  .filter((linha) => !SO_NO_SERVIDOR.includes(linha.split(/[[=<>~ ]/)[0].toLowerCase()));
// O Starlette do Pyodide não declara o anyio como dependência, mas usa.
requisitos.push('anyio');

const { loadPyodide } = await import(pathToFileURL(path.join(pyodideDir, 'pyodide.mjs')).href);

console.log('==> Instalando as dependências da API no Pyodide');
const py = await loadPyodide({ indexURL: pyodideDir + '/' });
await py.loadPackage('micropip');
const micropip = py.pyimport('micropip');
await micropip.install(requisitos);
const lock = JSON.parse(micropip.freeze());
const instalados = new Set(
  py.runPython('import micropip; [p for p in micropip.list()]').toJs().map((n) => n.toLowerCase()),
);

console.log('==> Copiando os pacotes usados');
const pacotes = {};
for (const [nome, info] of Object.entries(lock.packages)) {
  if (!instalados.has(nome.toLowerCase()) || nome === 'micropip' || nome === 'packaging') continue;
  const arquivo = path.basename(new URL(info.file_name, 'file:///').pathname);
  if (/^https?:/.test(info.file_name)) {
    const resposta = await fetch(info.file_name);
    if (!resposta.ok) throw new Error(`Falha ao baixar ${info.file_name}`);
    fs.writeFileSync(path.join(destino, arquivo), Buffer.from(await resposta.arrayBuffer()));
  } else {
    fs.copyFileSync(info.file_name, path.join(destino, arquivo));
  }
  pacotes[nome] = { ...info, file_name: arquivo };
}
fs.writeFileSync(
  path.join(destino, 'pyodide-lock.json'),
  JSON.stringify({ info: lock.info, packages: pacotes }),
);
for (const arquivo of [
  'pyodide.js',
  'pyodide.mjs',
  'pyodide.asm.mjs',
  'pyodide.asm.wasm',
  'python_stdlib.zip',
  'package.json',
]) {
  fs.copyFileSync(path.join(pyodideDir, arquivo), path.join(destino, arquivo));
}

console.log('==> Compactando o código da API');
execFileSync(
  'zip',
  ['-qr', path.join(destino, 'api.zip'), 'app', '-x', '*__pycache__*', 'app/importacao/*'],
  { cwd: path.join(raiz, 'api') },
);
const nomes = Object.keys(pacotes);
fs.writeFileSync(path.join(destino, 'pacotes.json'), JSON.stringify(nomes));
console.log(`    ${nomes.length} pacotes: ${nomes.join(', ')}`);

console.log('==> Conferindo a cópia publicada (login e recomendações)');
const inicio = Date.now();
const teste = await loadPyodide({ indexURL: destino + '/' });
await teste.loadPackage(nomes);
teste.unpackArchive(new Uint8Array(fs.readFileSync(path.join(destino, 'api.zip'))), 'zip', {
  extractDir: '/home/pyodide/api',
});
teste.runPython("import sys; sys.path.insert(0, '/home/pyodide/api')");
const navegador = teste.pyimport('app.navegador');

async function pedir(metodo, caminho, cabecalhos = {}, corpo = null) {
  const [status, , bytes] = (
    await navegador.responder(
      metodo,
      caminho,
      JSON.stringify({ 'content-type': 'application/json', ...cabecalhos }),
      corpo && new TextEncoder().encode(JSON.stringify(corpo)),
    )
  ).toJs();
  const texto = new TextDecoder().decode(bytes);
  if (status >= 400) throw new Error(`${metodo} ${caminho} respondeu ${status}: ${texto}`);
  return JSON.parse(texto);
}

const { access_token } = await pedir('POST', '/auth/login', {}, {
  email: 'turista@demo.tourlocal.app',
  senha: 'Demo@2026',
});
const { resultados } = await pedir(
  'GET',
  '/recomendacoes?eixo=comer&lat=-21.7946&lng=-48.1756&incluir_fechados=true',
  { authorization: `Bearer ${access_token}` },
);
if (!resultados.length) throw new Error('A recomendação voltou vazia');
console.log(`    ok: ${resultados.length} lugares para comer, em ${Date.now() - inicio} ms`);
