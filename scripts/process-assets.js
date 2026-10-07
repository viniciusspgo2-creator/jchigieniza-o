/**
 * Processa assets enviados: converte PNG/JPG/JFIF grandes em WebP otimizado
 * e copia o áudio para public/audio.
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const U = '/home/z/my-project/upload';
const PUB = '/home/z/my-project/public';

async function toWebp(src, dest, { width, height, quality = 84 } = {}) {
  const out = path.join(PUB, dest);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  let p = sharp(path.join(U, src)).webp({ quality });
  if (width || height) p = p.resize(width, height, { fit: 'inside', withoutEnlargement: true });
  const info = await p.toFile(out);
  console.log(`${dest}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)}KB`);
}

(async () => {
  // HERO — retrato do técnico JC (alta definição, substitui foto antiga de baixa qualidade)
  await toWebp('Firefly_gpt-image_Você é um especialista em  manipulação de imagens, designer gráfico de alto padrão, u 344212.png', 'img/site/hero-equipe.webp', { width: 960, quality: 86 });

  // Equipe limpando sofá (paisagem) — seção de diferenciais
  await toWebp('Firefly_gpt-image_Você é um especialista em  manipulação de imagens, designer gráfico de alto padrão, u 344212 (2).png', 'img/site/equipe-sofa.webp', { width: 1160, quality: 84 });

  // Card de riscos — ilustração de ácaros/sujeira no sofá
  await toWebp('sofa-1-1024x554-1.webp', 'img/site/riscos-estofado.webp', { quality: 86 });

  // Fotos da galeria
  await toWebp('fotohigioenizacao.png', 'img/galeria/higienizacao-em-andamento.webp', { width: 1080, quality: 84 });
  await toWebp('ADS-Criativos-Limpeza-de-Estofados-2-1024x1024.webp', 'img/galeria/antes-depois-sofa.webp', { quality: 88 });
  await toWebp('Limpeza-de-estofados-comerciais-cuidados-e-tecnicas-essenciais.webp', 'img/galeria/limpeza-comercial.webp', { width: 1160, quality: 84 });
  await toWebp('images.jfif', 'img/galeria/limpeza-sofa-branco.webp', { quality: 86 });
  await toWebp('19a3621e4f7839704b80d8e3f96140fc.jpg', 'img/galeria/estofado-claro-em-limpeza.webp', { quality: 86 });
  await toWebp('limpeza-sofa-osasco-butanta-cotia-barueri-vila-leopoldina-granja-viana-remocao-mancha-lavagem-estofados-local-clean.webp', 'img/galeria/detalhe-higienizacao.webp', { quality: 88 });

  // Áudio — mensagem de voz
  fs.mkdirSync(path.join(PUB, 'audio'), { recursive: true });
  fs.copyFileSync(path.join(U, 'Quer renovar o seu sof colcho ou o in.m4a'), path.join(PUB, 'audio/mensagem-jc.m4a'));
  console.log('audio/mensagem-jc.m4a copiado (' + (fs.statSync(path.join(PUB, 'audio/mensagem-jc.m4a')).size / 1024).toFixed(0) + 'KB)');
})().catch((e) => { console.error('ERRO:', e.message); process.exit(1); });
