const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const NOVOS = [
  {
    title: 'Higienização em andamento',
    description: 'Extração da sujeira direto no sofá, sem precisar transportar nada.',
    category: 'casa',
    image: '/img/galeria/higienizacao-em-andamento.webp',
    imageAlt: 'Boca de extração limpando estofado bege durante higienização profissional',
  },
  {
    title: 'Sofá claro em limpeza',
    description: 'Aplicação pontual em áreas com acúmulo de sujeira.',
    category: 'casa',
    image: '/img/galeria/limpeza-sofa-branco.webp',
    imageAlt: 'Técnico aplicando extração em sofá claro durante limpeza profissional',
  },
  {
    title: 'Estofado claro renovado',
    description: 'Detalhe do atendimento em estofado de tecido claro.',
    category: 'casa',
    image: '/img/galeria/estofado-claro-em-limpeza.webp',
    imageAlt: 'Sofá branco recebendo limpeza profissional com bico de extração',
  },
  {
    title: 'Limpeza profissional em detalhe',
    description: 'Cuidado com cada área do tecido, com produtos adequados.',
    category: 'casa',
    image: '/img/galeria/limpeza-comercial.webp',
    imageAlt: 'Mãos com luvas azuis limpando estofado cinza com equipamento de extração',
  },
  {
    title: 'Renovação de tecido bege',
    description: 'Trabalho de higienização em sofá de sala.',
    category: 'casa',
    image: '/img/galeria/detalhe-higienizacao.webp',
    imageAlt: 'Comparação por lente de aumento entre a sujeira acumulada e o tecido higienizado',
  },
  {
    title: 'Antes e depois de sofá branco',
    description: 'O contraste que a higienização bem feita entrega.',
    category: 'casa',
    image: '/img/galeria/antes-depois-sofa.webp',
    imageAlt: 'Comparativo antes e depois de sofá branco higienizado',
  },
];

(async () => {
  const last = await db.galleryItem.findMany({ where: { isComparator: false }, orderBy: { sortOrder: 'desc' }, take: 1 });
  let order = (last[0]?.sortOrder ?? 100) + 1;
  for (const n of NOVOS) {
    const exists = await db.galleryItem.findFirst({ where: { image: n.image } });
    if (exists) { console.log('já existe:', n.image); continue; }
    await db.galleryItem.create({ data: { ...n, isComparator: false, active: true, sortOrder: order++ } });
    console.log('criado:', n.image, 'ordem', order - 1);
  }
  await db.$disconnect();
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
