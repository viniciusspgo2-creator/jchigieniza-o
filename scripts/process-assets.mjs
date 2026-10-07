/**
 * Processa assets da JC Lavagem a Seco:
 * 1. Logo: fundo preto -> transparente; versão clara (branco -> azul profundo)
 * 2. Recortes antes/depois de fotos lado a lado / empilhadas
 * 3. Favicon + OG image
 */
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

const ROOT = '/home/z/my-project';
const UP = path.join(ROOT, 'upload', 'fotos-extract');
const BRAND = path.join(ROOT, 'public', 'img', 'brand');
const WORKS = path.join(ROOT, 'public', 'img', 'obras');
const BLOG = path.join(ROOT, 'public', 'img', 'blog');
for (const d of [BRAND, WORKS, BLOG]) mkdirSync(d, { recursive: true });

const LOGO_IN = path.join(ROOT, 'upload', 'Firefly_gpt-image_MELHORE A QUALIDADE DESSE LOGO, REMOVA A PIXELIZAÇÃO DEIXE ALTA DEFINIÇÃO, DEIXE O FU 329695-Photoroom.png');

const NAVY = [10, 35, 71]; // azul profundo da marca no site

async function processLogo() {
  const img = sharp(LOGO_IN);
  const { width, height } = await img.metadata();
  console.log('logo size', width, height);
  const raw = await img.ensureAlpha().raw().toBuffer();

  // Versão para superfícies escuras: fundo transparente, branco branco, vermelho vivo
  const dark = Buffer.from(raw);
  // Versão para superfícies claras: branco -> azul profundo, vermelho mantido
  const light = Buffer.from(raw);

  for (let i = 0; i < raw.length; i += 4) {
    const r = raw[i], g = raw[i + 1], b = raw[i + 2];
    const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    const isRed = r > g * 1.6 && r > b * 1.6 && r > 40;

    if (isRed) {
      // canal vermelho como alfa: núcleo do vermelho fica opaco e vivo; bordas suaves
      const a = Math.min(255, Math.round(r * 1.15));
      dark[i] = 226; dark[i + 1] = 32; dark[i + 2] = 46; dark[i + 3] = a;
      light[i] = 226; light[i + 1] = 32; light[i + 2] = 46; light[i + 3] = a;
    } else {
      const a = lum; // fundo preto -> alpha 0; ícone branco -> alpha 255
      dark[i] = 255; dark[i + 1] = 255; dark[i + 2] = 255; dark[i + 3] = a;
      light[i] = NAVY[0]; light[i + 1] = NAVY[1]; light[i + 2] = NAVY[2]; light[i + 3] = a;
    }
  }

  await sharp(dark, { raw: { width, height, channels: 4 } })
    .resize({ width: 900, withoutEnlargement: true }).png().toFile(path.join(BRAND, 'logo-jc-escuro.png'));
  await sharp(light, { raw: { width, height, channels: 4 } })
    .resize({ width: 900, withoutEnlargement: true }).png().toFile(path.join(BRAND, 'logo-jc-claro.png'));
  console.log('logos ok');
}

async function cropSideBySide(file, name, order) {
  // order 'LR': esquerda=antes, direita=depois | 'RL': esquerda=depois
  const src = path.join(UP, file);
  if (!existsSync(src)) { console.log('SKIP', file); return; }
  const meta = await sharp(src).metadata();
  const half = Math.floor(meta.width / 2);
  const left = order === 'LR' ? 'antes' : 'depois';
  const right = order === 'LR' ? 'depois' : 'antes';
  await sharp(src).extract({ left: 0, top: 0, width: half, height: meta.height })
    .resize({ width: 800, withoutEnlargement: true }).webp({ quality: 84 })
    .toFile(path.join(WORKS, `${name}-${left}.webp`));
  await sharp(src).extract({ left: half, top: 0, width: meta.width - half, height: meta.height })
    .resize({ width: 800, withoutEnlargement: true }).webp({ quality: 84 })
    .toFile(path.join(WORKS, `${name}-${right}.webp`));
  console.log('side', name, meta.width, meta.height);
}

async function cropStacked(file, name, cleanTop) {
  // cleanTop: a metade LIMPA é a superior
  const src = path.join(UP, file);
  if (!existsSync(src)) { console.log('SKIP', file); return; }
  const meta = await sharp(src).metadata();
  const half = Math.floor(meta.height / 2);
  const topName = cleanTop ? 'depois' : 'antes';
  const botName = cleanTop ? 'antes' : 'depois';
  await sharp(src).extract({ left: 0, top: 0, width: meta.width, height: half })
    .resize({ width: 900, withoutEnlargement: true }).webp({ quality: 84 })
    .toFile(path.join(WORKS, `${name}-${topName}.webp`));
  await sharp(src).extract({ left: 0, top: half, width: meta.width, height: meta.height - half })
    .resize({ width: 900, withoutEnlargement: true }).webp({ quality: 84 })
    .toFile(path.join(WORKS, `${name}-${botName}.webp`));
  console.log('stack', name, meta.width, meta.height);
}

async function copyFull(file, name, maxW = 1000) {
  const src = path.join(UP, file);
  if (!existsSync(src)) { console.log('SKIP', file); return; }
  await sharp(src).resize({ width: maxW, withoutEnlargement: true })
    .webp({ quality: 82 }).toFile(path.join(WORKS, name));
  console.log('full', name);
}

async function ogAndIcons() {
  // OG 1200x630 fundo azul profundo + textos
  const ogSvg = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="g1" cx="80%" cy="10%" r="80%">
        <stop offset="0%" stop-color="#123A73"/>
        <stop offset="100%" stop-color="#0A2347"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#g1)"/>
    <circle cx="1020" cy="120" r="150" fill="#BFE3FF" opacity="0.10"/>
    <circle cx="1090" cy="520" r="200" fill="#BFE3FF" opacity="0.08"/>
    <circle cx="150" cy="560" r="120" fill="#BFE3FF" opacity="0.07"/>
    <text x="600" y="150" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#9CC8F5" text-anchor="middle" letter-spacing="6">HIGIENIZAÇÃO DE ESTOFADOS EM GOIÂNIA</text>
    <text x="600" y="300" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="110" fill="#FFFFFF" text-anchor="middle">JC Lavagem a Seco</text>
    <text x="600" y="380" font-family="Arial, Helvetica, sans-serif" font-size="38" fill="#FF4D5A" font-weight="700" text-anchor="middle">Sofás · Colchões · Carrinhos · Interior veicular</text>
    <text x="600" y="500" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#DCEBF9" text-anchor="middle">(62) 99157-9369 · Atendimento a domicílio</text>
  </svg>`);
  await sharp(ogSvg).png().toFile(path.join(BRAND, 'og-image.png'));

  // icon 512: quadrado azul arredondado com JC branco + brilho vermelho
  const iconSvg = Buffer.from(`<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="96" fill="#0A2347"/>
    <text x="256" y="300" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="190" fill="#FFFFFF" text-anchor="middle">JC</text>
    <path d="M 400 130 L 416 180 L 466 196 L 416 212 L 400 262 L 384 212 L 334 196 L 384 180 Z" fill="#E0202E"/>
    <text x="256" y="400" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="700" fill="#BFE3FF" text-anchor="middle">Lavagem a Seco</text>
  </svg>`);
  await sharp(iconSvg).resize(512, 512).png().toFile(path.join(BRAND, 'icon-512.png'));
  await sharp(iconSvg).resize(180, 180).png().toFile(path.join(BRAND, 'apple-icon.png'));
  await sharp(iconSvg).resize(64, 64).png().toFile(path.join(ROOT, 'public', 'favicon.png'));
  console.log('og/icons ok');
}

async function main() {
  await processLogo();

  // Lado a lado (esquerda=antes, direita=depois)
  await cropSideBySide('unnamed (2).webp', 'banco-carro', 'LR');
  await cropSideBySide('unnamed (12).webp', 'sofa-cinza', 'LR');
  await cropSideBySide('unnamed (13).webp', 'colchao', 'LR');
  await cropSideBySide('unnamed (15).webp', 'sofa-bege', 'LR');
  await cropSideBySide('unnamed (17).webp', 'cadeiras-jantar', 'LR');
  await cropSideBySide('unnamed (16).webp', 'sofa-veludo-close', 'LR');

  // Empilhadas
  await cropStacked('unnamed (1).webp', 'sofa-suede', true);   // topo = Depois
  await cropStacked('unnamed (3).webp', 'colchao-solta', false); // baixo = Depois
  await cropStacked('unnamed (10).webp', 'sofa-retratil', false); // baixo = Depois
  await cropStacked('unnamed (11).webp', 'sofa-laranja', false);
  await cropStacked('unnamed (14).webp', 'sofa-suede-cinza', false);

  // Completas para galeria
  await copyFull('unnamed (4).webp', 'bebe-conforto-comparativo.webp');
  await copyFull('unnamed (6).webp', 'carrinho-bebe-comparativo.webp');
  await copyFull('unnamed (7).webp', 'bebe-conforto-2-comparativo.webp');
  await copyFull('unnamed (8).webp', 'banco-carro-traseiro-comparativo.webp');
  await copyFull('unnamed (9).webp', 'cadeiras-comparativo.webp');
  await copyFull('unnamed (18).webp', 'colchao-metade.webp');

  // Capas de blog
  await sharp(path.join(UP, 'unnamed (12).webp')).resize({ width: 1100, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(BLOG, 'sofa-goiania.webp'));
  await sharp(path.join(UP, 'unnamed (13).webp')).resize({ width: 1100, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(BLOG, 'colchao-higienizacao.webp'));
  await sharp(path.join(UP, 'unnamed (15).webp')).resize({ width: 1100, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(BLOG, 'limpeza-sofa-erros.webp'));
  await sharp(path.join(UP, 'unnamed (16).webp')).resize({ width: 1100, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(BLOG, 'impermeabilizacao.webp'));
  await sharp(path.join(UP, 'unnamed (2).webp')).resize({ width: 1100, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(BLOG, 'bancos-carro.webp'));
  await sharp(path.join(UP, 'unnamed (6).webp')).resize({ width: 1100, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(BLOG, 'carrinho-bebe.webp'));

  await ogAndIcons();
  console.log('ALL ASSETS DONE');
}
main().catch((e) => { console.error(e); process.exit(1); });
