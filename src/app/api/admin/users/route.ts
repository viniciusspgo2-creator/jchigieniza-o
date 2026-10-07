import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireAdmin, hashPassword } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  name: z.string().trim().min(3).max(120),
  email: z.string().trim().email().max(160),
  role: z.enum(['ADMIN', 'OPERADOR']),
  password: z.string().min(10).max(200).regex(/[A-Za-zçÇ]/).regex(/[0-9]/),
});

/** GET /api/admin/users — apenas ADMIN. */
export async function GET() {
  try {
    await requireAdmin();
    const users = await db.user.findMany({
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return ok({ users });
  } catch (e) {
    return handleError(e);
  }
}

/** POST /api/admin/users — cria operador/admin (senha inicial definida pelo admin). */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const parsed = await parseBody(req, createSchema);
    if ('error' in parsed) return parsed.error;
    const { name, email, role, password } = parsed.data;

    const dup = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (dup) return fail('Já existe um usuário com esse e-mail.', 409);

    const user = await db.user.create({
      data: { name, email: email.toLowerCase(), role, passwordHash: await hashPassword(password) },
    });
    await audit({ user: admin, action: 'CREATE', entity: 'User', entityId: user.id, details: { role } });
    return ok({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
