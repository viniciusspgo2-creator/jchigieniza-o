/**
 * Gera a arte premium da seção "O que se acumula no silêncio dos tecidos"
 * (sofá com lentes de aumento revelando ácaros/bactérias) e grava em WebP.
 * Uso: node scripts/gen-riscos-img.mjs
 */
import ZAI from 'z-ai-web-dev-sdk';
import sharp from 'sharp';
import fs from 'fs';

const OUT_RAW = '/home/z/my-project/scripts/out-riscos-raw.png';
const OUT_WEBP = '/home/z/my-project/public/img/site/riscos-estofado.webp';

const PROMPT =
  'Photorealistic premium 3D render illustration: a light beige fabric sofa standing in a dark navy blue studio background (deep blue #0B1F44), two large circular magnifying glass callout lenses floating in front of the sofa cushions, the lenses reveal macroscopic dust mites, germs and bacteria particles rendered in glowing teal and cyan tones, high detail inside the lenses, clean modern infographic aesthetic, cinematic soft lighting, subtle blue rim light, no text, no words, no letters, no watermark, high quality, detailed';

async function main() {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const zai = await ZAI.create();
      const res = await zai.images.generations.create({ prompt: PROMPT, size: '1152x864' });
      const b64 = res?.data?.[0]?.base64;
      if (!b64) throw new Error('Resposta sem imagem');
      fs.writeFileSync(OUT_RAW, Buffer.from(b64, 'base64'));
      lastErr = null;
      break;
    } catch (e) {
      lastErr = e;
      console.error(`Tentativa ${attempt} falhou:`, e.message);
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  if (lastErr) throw lastErr;

  await sharp(OUT_RAW)
    .resize({ width: 1152, height: 864, fit: 'cover' })
    .webp({ quality: 86 })
    .toFile(OUT_WEBP);

  const kb = Math.round(fs.statSync(OUT_WEBP).size / 1024);
  console.log(`OK: ${OUT_WEBP} (${kb} KB)`);
}

main().catch((e) => {
  console.error('FALHOU:', e.message);
  process.exit(1);
});
