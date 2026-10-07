import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { isValidDateStr } from '@/lib/tz';

export const dynamic = 'force-dynamic';

const schema = z.object({
  bookingId: z.string().min(1),
  amountCents: z.coerce.number().int().min(1, 'Valor inválido.'),
  dueDate: z.string().refine(isValidDateStr, 'Data inválida.').optional().nullable(),
});

/**
 * POST /api/admin/finance/receivable — gera conta a receber de um atendimento concluído.
 * Idempotente: o vínculo bookingId é único; tentativa duplicada retorna a conta existente.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = await parseBody(req, schema);
    if ('error' in parsed) return parsed.error;
    const { bookingId, amountCents, dueDate } = parsed.data;

    const booking = await db.booking.findUnique({ where: { id: bookingId }, include: { service: true, transaction: true } });
    if (!booking) return fail('Agendamento não encontrado.', 404);
    if (booking.status !== 'CONCLUIDO') return fail('Só é possível gerar receita para atendimentos concluídos.', 409);

    if (booking.transaction) {
      return ok({ transaction: booking.transaction, existing: true });
    }

    const receivable = await db.transaction.create({
      data: {
        type: 'INCOME',
        kind: 'RECEITA_SERVICO',
        description: `Serviço ${booking.service.name} — ${booking.protocol}`,
        amountCents,
        status: 'PENDENTE',
        dueDate: dueDate || booking.preferredDate,
        customerId: booking.customerId,
        bookingId: booking.id,
      },
    });
    await audit({ user, action: 'CREATE', entity: 'Transaction', entityId: receivable.id, details: { bookingId, amountCents } });
    return ok({ transaction: receivable, existing: false }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
