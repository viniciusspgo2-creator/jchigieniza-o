/**
 * Cria o administrador inicial apontando para o Postgres local (mesmo fluxo do /admin/setup).
 * Uso: DATABASE_URL=... node scripts/seed-admin.js [email] [senha]
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// mesmo algoritmo de src/lib/auth.ts (bcrypt, 12 rounds)
const hashPassword = (password) => bcrypt.hash(password, 12);

const db = new PrismaClient();

(async () => {
  const email = process.argv[2] || 'admin@jclavagemaseco.com.br';
  const password = process.argv[3];
  if (!password) { console.error('Uso: node scripts/seed-admin.js <email> <senha>'); process.exit(1); }
  const exists = await db.user.findUnique({ where: { email } });
  if (exists) {
    console.log('admin já existe:', email);
    await db.$disconnect();
    return;
  }
  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: { name: 'Jhone Costa', email, passwordHash, role: 'ADMIN', active: true },
  });
  console.log('admin criado:', user.email, 'role', user.role);
  await db.$disconnect();
})().catch((e) => {
  console.error('ERR:', e.message);
  process.exit(1);
});
