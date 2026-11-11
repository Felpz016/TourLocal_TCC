// Coloca a demonstração web dentro de uma moldura de celular quando aberta no computador.
//
// Grava <site>/celular.html (a moldura, com o app num iframe) e acrescenta ao index.html e ao
// 404.html um script que, num computador (tela larga e mouse), leva para a moldura mantendo a
// tela pedida. No celular, o app continua em tela cheia, como um app instalado. O link
// "Abrir sem moldura" (?moldura=0) desliga o redirecionamento até fechar a aba.
//
//   node scripts/demo-web/moldura.mjs <site> <caminho-base> <url-do-repositorio>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [site, base, repositorio] = process.argv.slice(2);
if (!site || base === undefined || !repositorio) {
  console.error('Uso: node moldura.mjs <site> <caminho-base> <url-do-repositorio>');
  process.exit(1);
}
const pasta = path.dirname(fileURLToPath(import.meta.url));
const moldura = fs
  .readFileSync(path.join(pasta, 'celular.html'), 'utf8')
  .replaceAll('__BASE__', base)
  .replaceAll('__REPO__', repositorio);
fs.writeFileSync(path.join(site, 'celular.html'), moldura);

const redirecionar = `<script>
(function () {
  try {
    if (window.top !== window.self) return; // já está dentro da moldura
    if (new URLSearchParams(location.search).get('moldura') === '0') {
      sessionStorage.setItem('semMoldura', '1');
      return;
    }
    if (sessionStorage.getItem('semMoldura')) return;
    if (!matchMedia('(min-width: 700px) and (pointer: fine)').matches) return; // celular
    var base = ${JSON.stringify(base)};
    var caminho = location.pathname.slice(base.length) + location.search + location.hash;
    location.replace(base + '/celular.html?caminho=' + encodeURIComponent(caminho || '/'));
  } catch (e) {}
})();
</script>`;
for (const arquivo of ['index.html', '404.html']) {
  const caminho = path.join(site, arquivo);
  if (!fs.existsSync(caminho)) continue;
  const html = fs.readFileSync(caminho, 'utf8');
  if (!html.includes('<head>')) throw new Error(`${arquivo} sem <head>`);
  fs.writeFileSync(caminho, html.replace('<head>', `<head>${redirecionar}`));
}
console.log(`Moldura de celular pronta em ${path.join(site, 'celular.html')}`);
