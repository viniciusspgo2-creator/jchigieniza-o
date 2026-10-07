import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/** GET /api/admin/financial-accounts — contas (caixa, banco, pix). */
export async function GET() {
  try {
    await requireAdmin();
    const accounts = await db.financialAccount.findMany({
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
      include: { _count: { select: { transactions: true } } },
    });
    return ok({ accounts });
  } catch (e) {
    return handleError(e);
  }
}

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  type: z.enum(['CAIXA', 'BANCO', 'PIX', 'OUTRO']).optional(),
});

/** POST /api/admin/financial-accounts — cria conta. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin();
    const parsed = await parseBody(req, createSchema);
    if ('error' in parsed) return parsed.error;

    const dup = await db.financialAccount.findFirst({ where: { name: parsed.data.name } });
    if (dup) return fail('Já existe uma conta com esse nome.', 409);

    const account = await db.financialAccount.create({ data: parsed.data });
    await audit({ user, action: 'CREATE', entity: 'FinancialAccount', entityId: account.id, details: { name: account.name } });
    return ok({ account }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

const patchSchema = z.object({
  id: z.string().min(1),
  active: z.boolean().optional(),
  name: z.string().trim().min(2).max(80).optional(),
});

/** PATCH /api/admin/financial-accounts — renomeia ou ativa/desativa. */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAdmin();
    const parsed = await parseBody(req, patchSchema);
    if ('error' in parsed) return parsed.error;
    const { id, ...data } = parsed.data;

    const account = await db.financialAccount.update({ where: { id }, data });
    await audit({ user, action: 'UPDATE', entity: 'FinancialAccount', entityId: id, details: data });
    return ok({ account });
  } catch (e) {
    return handleError(e);
  }
}
