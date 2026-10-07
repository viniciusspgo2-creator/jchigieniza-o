/* Consulta rápida do estado atual do banco (SQLite no sandbox). */
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
(async () => {
  const sc = await db.siteContent.findMany({ select: { key: true } });
  console.log('SiteContent keys:', sc.map((r) => r.key).join(', ') || '(nenhuma)');
  const pm = await db.paymentMethod.findMany({ orderBy: { id: 'asc' } });
  console.log('PaymentMethods:', pm.map((p) => `${p.name}(active=${p.active})`).join(' | '));
  const posts = await db.post.findMany({ select: { slug: true, coverImage: true, title: true } });
  posts.forEach((p) => console.log('POST:', p.slug, '→', p.coverImage, '«', p.title.slice(0, 60)));
  const gal = await db.galleryItem.count();
  const gcomp = await db.galleryItem.count({ where: { isComparator: true } });
  console.log('Gallery:', gal, 'itens,', gcomp, 'comparadores');
  const img = await db.galleryItem.findMany({ where: { isComparator: false }, select: { image: true } });
  console.log('Imagens via /api/uploads:', img.filter((g) => g.image.startsWith('/api/uploads')).length);
  const users = await db.user.findMany({ select: { email: true, role: true } });
  console.log('Users:', users.map((u) => `${u.email}(${u.role})`).join(', ') || '(nenhum)');
  await db.$disconnect();
})().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
