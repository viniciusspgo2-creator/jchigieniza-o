import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireUser, requireAdmin } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/** GET /api/admin/payment-methods — formas de pagamento + categorias + contas (config do financeiro/chatbot). */
export async function GET() {
  try {
    await requireUser();
    const [methods, categories, accounts] = await Promise.all([
      db.paymentMethod.findMany({ orderBy: { sortOrder: 'asc' } }),
      db.financialCategory.findMany({ orderBy: [{ type: 'asc' }, { name: 'asc' } ] }),
      db.financialAccount.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
    ]);
    return ok({ methods, categories, accounts });
  } catch (e) {
    return handleError(e);
  }
}

const createSchema = z.object({
  name: z.string().trim().min(2).max(60),
});

/** POST /api/admin/payment-methods — nova forma de pagamento. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin();
    const parsed = await parseBody(req, createSchema);
    if ('error' in parsed) return parsed.error;
    const dup = await db.paymentMethod.findFirst({ where: { name: parsed.data.name } });
    if (dup) return fail('Já existe uma forma com esse nome.', 409);
    const method = await db.paymentMethod.create({ data: { name: parsed.data.name, sortOrder: 50 } });
    await audit({ user, action: 'CREATE', entity: 'PaymentMethod', entityId: method.id, details: { name: method.name } });
    return ok({ method }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

const patchSchema = z.object({
  id: z.string().min(1),
  active: z.boolean().optional(),
  name: z.string().trim().min(2).max(60).optional(),
});

/** PATCH /api/admin/payment-methods — renomeia ou ativa/desativa. */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAdmin();
    const parsed = await parseBody(req, patchSchema);
    if ('error' in parsed) return parsed.error;
    const { id, ...data } = parsed.data;
    const method = await db.paymentMethod.update({ where: { id }, data });
    await audit({ user, action: 'UPDATE', entity: 'PaymentMethod', entityId: id, details: data });
    return ok({ method });
  } catch (e) {
    return handleError(e);
  }
}
