// Tira prints das principais telas da versão web do TourLocal, em claro e escuro.
// Pré-requisito: bash scripts/agentes/subir-ambiente.sh (API em :8000, web em :8081).
// Uso: node scripts/agentes/capturar-telas.mjs [pasta-de-saida]
// Os prints saem em largura de celular (390x844) e um de desktop (1440x900).
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const SAIDA = process.argv[2] ?? '/tmp/tourlocal-agente/prints';
const WEB = process.env.WEB_URL ?? 'http://localhost:8081';
const SENHA = 'Demo@2026';
// Centro de Araraquara, onde ficam os lugares de demonstração.
const POSICAO = { latitude: -21.7946, longitude: -48.1756 };

mkdirSync(SAIDA, { recursive: true });

async function entrar(page, email) {
  await page.goto(WEB, { waitUntil: 'networkidle' });
  await page.getByPlaceholder('voce@email.com').fill(email);
  await page.getByPlaceholder('Sua senha').fill(SENHA);
  await page.getByPlaceholder('Sua senha').press('Enter');
  await page.waitForTimeout(2500);
}

async function print(page, nome) {
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SAIDA}/${nome}.png` });
  console.log(`  ${nome}.png`);
}

async function aba(page, titulo) {
  await page.getByRole('tab', { name: titulo }).locator('visible=true').first().click();
}

async function sessao(browser, { tema, email, largura = 390, altura = 844, prefixo }, roteiro) {
  const ctx = await browser.newContext({
    viewport: { width: largura, height: altura },
    colorScheme: tema,
    geolocation: POSICAO,
    permissions: ['geolocation'],
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log(`  [erro na página] ${e.message}`));
  if (email) await entrar(page, email);
  else await page.goto(WEB, { waitUntil: 'networkidle' });
  await roteiro(page, (nome) => print(page, `${prefixo}-${nome}`));
  await ctx.close();
}

const browser = await chromium.launch();
for (const tema of ['light', 'dark']) {
  const t = tema === 'light' ? 'claro' : 'escuro';
  console.log(`Tema ${t}`);

  await sessao(browser, { tema, prefixo: t }, async (page, p) => {
    await p('01-login');
  });

  await sessao(
    browser,
    { tema, email: 'turista@demo.tourlocal.app', prefixo: t },
    async (page, p) => {
      await p('02-comer');
      await page.mouse.move(195, 650);
      await page.mouse.wheel(0, 900);
      await p('02b-comer-rolado');
      await page.mouse.wheel(0, -900);
      const cartao = page
        .getByRole('button')
        .filter({ hasText: /km/ })
        .locator('visible=true')
        .first();
      if (await cartao.count()) {
        await cartao.click();
        await p('03-detalhe');
        await page.mouse.move(195, 650);
        await page.mouse.wheel(0, 900);
        await p('03b-detalhe-rolado');
        await page.goBack();
      }
      for (const [titulo, nome] of [
        ['Ficar', '04-ficar'],
        ['Fazer', '05-fazer'],
        ['Salvos', '06-salvos'],
        ['Perfil', '07-perfil'],
      ]) {
        await aba(page, titulo).catch(() => console.log(`  (aba ${titulo} não encontrada)`));
        await p(nome);
      }
    },
  );

  await sessao(
    browser,
    { tema, email: 'comerciante@demo.tourlocal.app', prefixo: t },
    async (page, p) => {
      await aba(page, 'Meus locais').catch(() => {});
      await p('08-meus-locais');
    },
  );

  await sessao(
    browser,
    { tema, email: 'admin@demo.tourlocal.app', prefixo: t },
    async (page, p) => {
      await aba(page, 'Moderação').catch(() => {});
      await p('09-moderacao');
    },
  );
}

await sessao(
  browser,
  {
    tema: 'light',
    email: 'turista@demo.tourlocal.app',
    largura: 1440,
    altura: 900,
    prefixo: 'desktop',
  },
  async (page, p) => {
    await p('comer');
  },
);
await browser.close();
console.log(`Prints em ${SAIDA}`);
