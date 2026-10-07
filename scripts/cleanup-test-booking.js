const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
(async () => {
  const b = await db.booking.deleteMany({ where: { name: 'Teste QA Galeria' } });
  console.log('agendamentos de teste removidos:', b.count);
  const c = await db.customer.deleteMany({ where: { name: 'Teste QA Galeria' } });
  console.log('clientes de teste removidos:', c.count);
  await db.$disconnect();
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
