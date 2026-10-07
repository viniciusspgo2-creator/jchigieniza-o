/**
 * Renderiza as 6 capas profissionais do blog (HTML/CSS → Chromium → WebP).
 * Uso: node scripts/blog-covers/gen-covers.mjs
 */
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const HTML = 'file:///home/z/my-project/scripts/blog-covers/covers.html';
const EXEC = (() => {
  const bases = ['/home/z/.cache/ms-playwright', '/root/.cache/ms-playwright'];
  for (const base of bases) {
    for (const dir of fs.readdirSync(base)) {
      const p = path.join(base, dir, 'chrome-linux64', 'chrome');
      if (fs.existsSync(p)) return p;
    }
  }
  throw new Error('Chromium não encontrado');
})();

const OUT = [
  ['capa-1', '/home/z/my-project/public/img/blog/sofa-goiania.webp'],
  ['capa-2', '/home/z/my-project/public/img/blog/colchao-higienizacao.webp'],
  ['capa-3', '/home/z/my-project/public/img/blog/limpeza-sofa-erros.webp'],
  ['capa-4', '/home/z/my-project/public/img/blog/impermeabilizacao.webp'],
  ['capa-5', '/home/z/my-project/public/img/blog/bancos-carro.webp'],
  ['capa-6', '/home/z/my-project/public/img/blog/carrinho-bebe.webp'],
];

const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox', '--force-device-scale-factor=2'] });
const page = await browser.newPage({ viewport: { width: 1300, height: 760 }, deviceScaleFactor: 2 });
await page.goto(HTML, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);

for (const [id, outPath] of OUT) {
  const el = page.locator(`#${id}`);
  const buf = await el.screenshot({ type: 'png' });
  await sharp(buf).resize({ width: 1200, height: 675, fit: 'cover' }).webp({ quality: 84 }).toFile(outPath);
  const kb = Math.round(fs.statSync(outPath).size / 1024);
  console.log(`OK ${id} → ${outPath} (${kb} KB)`);
}

await browser.close();
console.log('Capas geradas.');
