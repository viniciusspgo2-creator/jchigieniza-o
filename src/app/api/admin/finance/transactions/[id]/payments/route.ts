import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { paymentSchema } from '@/lib/validation';
import { audit, notify } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/finance/transactions/[id]/payments — registra recebimento/pagamento (parcial ou total).
 * Regras:
 * - Não aceita valor acima do saldo restante (evita duplicação/estorno indevido).
 * - Lançamento cancelado não recebe pagamento.
 * - Ao quitar o saldo, status passa a PAGO com paidAt.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const parsed = await parseBody(req, paymentSchema);
    if ('error' in parsed) return parsed.error;
    const data = parsed.data;

    const result = await db.$transaction(async (tx) => {
      const t = await tx.transaction.findUnique({ where: { id }, include: { payments: true } });
      if (!t) throw new Error('NOT_FOUND');
      if (t.status === 'CANCELADO') throw new Error('CANCELADO');

      const paidCents = t.payments.reduce((acc, p) => acc + p.amountCents, 0);
      const remaining = t.amountCents - paidCents;
      if (remaining <= 0) throw new Error('ALREADY_PAID');
      if (data.amountCents > remaining) throw new Error('OVERPAY');

      const payment = await tx.transactionPayment.create({
        data: {
          transactionId: id,
          amountCents: data.amountCents,
          paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
          methodId: data.methodId || null,
          accountId: data.accountId || null,
          note: data.note || null,
        },
      });

      const newPaid = paidCents + data.amountCents;
      const fullyPaid = newPaid >= t.amountCents;
      const updated = await tx.transaction.update({
        where: { id },
        data: { status: fullyPaid ? 'PAGO' : 'PENDENTE', paidAt: fullyPaid ? payment.paidAt : null },
      });
      return { payment, updated, remaining: t.amountCents - newPaid };
    }).catch((e) => {
      if (e.message === 'NOT_FOUND') throw new NotFoundError('Lançamento não encontrado.');
      if (e.message === 'CANCELADO') throw new ConflictError('Lançamento cancelado não recebe pagamentos.');
      if (e.message === 'ALREADY_PAID') throw new ConflictError('Esse lançamento já está totalmente quitado.');
      if (e.message === 'OVERPAY') throw new ConflictError('Valor maior que o saldo restante.');
      throw e;
    });

    await audit({ user, action: 'PAYMENT', entity: 'Transaction', entityId: id, details: { amountCents: data.amountCents, remaining: result.remaining } });
    if (result.remaining === 0) {
      await notify({
        type: 'FINANCEIRO',
        title: 'Lançamento quitado',
        message: `${result.updated.description} foi totalmente ${result.updated.type === 'INCOME' ? 'recebido' : 'pago'}.`,
        link: '/admin/financeiro',
      });
    }
    return ok({ payment: result.payment, transaction: result.updated, remainingCents: result.remaining }, { status: 201 });
  } catch (e) {
    if (e instanceof NotFoundError) return fail(e.message, 404);
    if (e instanceof ConflictError) return fail(e.message, 409);
    return handleError(e);
  }
}

class NotFoundError extends Error {}
class ConflictError extends Error {}
