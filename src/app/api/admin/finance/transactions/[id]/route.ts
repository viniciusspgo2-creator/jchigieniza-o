import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireUser, requireAdmin } from '@/lib/auth';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/admin/finance/transactions/[id] — cancelamento com histórico preservado.
 * Lançamentos liquidados (com pagamentos) NÃO são apagados: ficam com status CANCELADO.
 * Somente ADMIN.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin();
    const { id } = await params;
    const tx = await db.transaction.findUnique({ where: { id }, include: { payments: true } });
    if (!tx) return fail('Lançamento não encontrado.', 404);

    if (tx.payments.length > 0) {
      // Preserva histórico: liquidadas são canceladas, nunca apagadas
      await db.transaction.update({ where: { id }, data: { status: 'CANCELADO' } });
      await audit({ user, action: 'CANCEL', entity: 'Transaction', entityId: id, details: { hadPayments: true } });
      return ok({ cancelled: true, message: 'Lançamento com recebimentos/pagamentos registrados foi cancelado (histórico preservado).' });
    }

    await db.transaction.delete({ where: { id } });
    await audit({ user, action: 'DELETE', entity: 'Transaction', entityId: id, details: { amountCents: tx.amountCents } });
    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}

/** GET /api/admin/finance/transactions/[id] */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    const tx = await db.transaction.findUnique({
      where: { id },
      include: {
        customer: true, supplier: true, category: true, account: true, paymentMethod: true,
        booking: { select: { protocol: true } },
        payments: { include: { method: { select: { name: true } } }, orderBy: { paidAt: 'asc' } },
      },
    });
    if (!tx) return fail('Lançamento não encontrado.', 404);
    return ok({ transaction: tx });
  } catch (e) {
    return handleError(e);
  }
}
