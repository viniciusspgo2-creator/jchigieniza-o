import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  const bookings = await db.booking.findMany({ where: { name: 'Maria Teste Design' } });
  for (const b of bookings) {
    await db.booking.delete({ where: { id: b.id } });
    console.log('booking removido:', b.protocol);
  }
  const customers = await db.customer.findMany({ where: { name: 'Maria Teste Design' } });
  for (const c of customers) {
    await db.customer.delete({ where: { id: c.id } });
    console.log('customer removido');
  }
  console.log('cleanup ok');
}
main().finally(() => db.$disconnect());
