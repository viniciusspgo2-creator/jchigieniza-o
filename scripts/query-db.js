const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
(async () => {
  const gal = await db.galleryItem.findMany({ orderBy: { sortOrder: 'asc' } });
  console.log('GALLERY:');
  for (const g of gal) {
    console.log(JSON.stringify({ id: g.id, title: g.title, cat: g.category, comp: g.isComparator, img: g.image, before: g.beforeImage, after: g.afterImage, active: g.active }));
  }
  const pm = await db.paymentMethod.findMany();
  console.log('PAYMENTS:');
  for (const p of pm) {
    console.log(JSON.stringify({ name: p.name, active: p.active, desc: p.description }));
  }
  const svc = await db.serviceCategory.findMany({ include: { services: true }, orderBy: { sortOrder: 'asc' } });
  console.log('CATEGORIES:', svc.map(s => s.name + ' (' + s.services.length + ')').join(' | '));
  await db.$disconnect();
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
