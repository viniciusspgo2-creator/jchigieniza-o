import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { audit, notify } from '@/lib/audit';
import { isValidDateStr, spWallTimeToUTC } from '@/lib/tz';
import { isSlotValid } from '@/lib/slots';
import { formatBRL } from '@/lib/money';

export const dynamic = 'force-dynamic';

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('status'), status: z.enum(['SOLICITADO', 'EM_ANALISE', 'EM_ATENDIMENTO']) }),
  z.object({ action: z.literal('confirmar'), date: z.string().refine(isValidDateStr, 'Data inválida.'), slot: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido.') }),
  z.object({ action: z.literal('reagendar'), date: z.string().refine(isValidDateStr, 'Data inválida.'), slot: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido.') }),
  z.object({ action: z.literal('cancelar'), reason: z.string().trim().max(300).optional().or(z.literal('')) }),
  z.object({
    action: z.literal('concluir'),
    amountCents: z.coerce.number().int().min(0),
    createReceivable: z.boolean().optional(),
    dueDate: z.string().refine(isValidDateStr, 'Data inválida.').optional().nullable(),
  }),
  z.object({ action: z.literal('nota'), internalNotes: z.string().trim().max(2000) }),
]);

/**
 * PATCH /api/admin/bookings/[id] — ações operacionais.
 * A confirmação usa transação + verificação de capacidade para impedir conflitos:
 * dois operadores confirmando a mesma janela ao mesmo tempo geram erro 409 em um deles.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const parsed = await parseBody(req, actionSchema);
    if ('error' in parsed) return parsed.error;
    const data = parsed.data;

    const booking = await db.booking.findUnique({ where: { id }, include: { service: true, transaction: true } });
    if (!booking) return fail('Agendamento não encontrado.', 404);

    if (data.action === 'status') {
      const updated = await db.booking.update({ where: { id }, data: { status: data.status } });
      await audit({ user, action: 'BOOKING_STATUS', entity: 'Booking', entityId: id, details: { status: data.status } });
      return ok({ booking: updated });
    }

    if (data.action === 'cancelar') {
      if (booking.status === 'CONCLUIDO') return fail('Atendimento concluído não pode ser cancelado.', 409);
      const updated = await db.booking.update({
        where: { id },
        data: { status: 'CANCELADO', cancelledAt: new Date(), cancelReason: data.reason || null },
      });
      await audit({ user, action: 'BOOKING_CANCEL', entity: 'Booking', entityId: id, details: { reason: data.reason } });
      await notify({
        type: 'AGENDAMENTO',
        title: `Agendamento ${booking.protocol} cancelado`,
        message: `${user.name} cancelou o agendamento de ${booking.name}.`,
        bookingId: id,
        link: '/admin/agendamentos',
      });
      return ok({ booking: updated });
    }

    if (data.action === 'nota') {
      const updated = await db.booking.update({ where: { id }, data: { internalNotes: data.internalNotes } });
      await audit({ user, action: 'BOOKING_NOTE', entity: 'Booking', entityId: id });
      return ok({ booking: updated });
    }

    if (data.action === 'confirmar' || data.action === 'reagendar') {
      if (booking.status === 'CANCELADO' || booking.status === 'CONCLUIDO') {
        return fail(`Agendamento ${booking.status.toLowerCase()} não pode ser confirmado.`, 409);
      }
      const slotValid = await isSlotValid(data.date, data.slot);
      if (!slotValid) return fail('Janela indisponível (horário, folga ou capacidade). Verifique a agenda.', 409);

      // Transação: re-verifica capacidade no momento da escrita
      const result = await db.$transaction(async (tx) => {
        const rule = await tx.businessHours.findFirst({ where: { active: true } });
        const capacity = rule?.capacityPerSlot ?? 1;
        const conflicts = await tx.booking.count({
          where: {
            preferredDate: data.date,
            timeSlot: data.slot,
            status: { in: ['CONFIRMADO', 'EM_ATENDIMENTO'] },
            id: { not: id },
          },
        });
        if (conflicts >= capacity) {
          throw new ConflictError('Essa janela já tem atendimento confirmado. Escolha outro horário.');
        }
        const scheduledAt = spWallTimeToUTC(data.date, data.slot);
        return tx.booking.update({
          where: { id },
          data: {
            status: 'CONFIRMADO',
            preferredDate: data.date,
            timeSlot: data.slot,
            scheduledAt,
            confirmedAt: new Date(),
          },
        });
      }).catch((e) => {
        if (e instanceof ConflictError) throw e;
        throw e;
      });

      await audit({ user, action: 'BOOKING_CONFIRM', entity: 'Booking', entityId: id, details: { date: data.date, slot: data.slot } });
      await notify({
        type: 'AGENDAMENTO',
        title: `Agendamento ${booking.protocol} confirmado`,
        message: `${booking.name} — ${booking.service.name} em ${data.date} às ${data.slot}.`,
        bookingId: id,
        link: '/admin/agendamentos',
      });
      return ok({ booking: result });
    }

    if (data.action === 'concluir') {
      if (booking.status === 'CANCELADO') return fail('Agendamento cancelado não pode ser concluído.', 409);
      const updated = await db.booking.update({ where: { id }, data: { status: 'CONCLUIDO', completedAt: new Date() } });

      let receivable: Awaited<ReturnType<typeof db.transaction.create>> | null = null;
      if (data.createReceivable && data.amountCents > 0) {
        // Idempotência garantida por bookingId @unique: 1 receita por OS
        if (!booking.transaction) {
          receivable = await db.transaction.create({
            data: {
              type: 'INCOME',
              kind: 'RECEITA_SERVICO',
              description: `Serviço ${booking.service.name} — ${booking.protocol}`,
              amountCents: data.amountCents,
              status: 'PENDENTE',
              dueDate: data.dueDate || booking.preferredDate,
              customerId: booking.customerId,
              bookingId: booking.id,
            },
          });
          await notify({
            type: 'FINANCEIRO',
            title: 'Conta a receber criada',
            message: `${formatBRL(data.amountCents)} referente a ${booking.protocol}.`,
            link: '/admin/financeiro',
          });
        }
      }

      await audit({ user, action: 'BOOKING_COMPLETE', entity: 'Booking', entityId: id, details: { amountCents: data.amountCents, receivable: receivable?.id ?? null } });
      return ok({ booking: updated, receivable });
    }

    return fail('Ação desconhecida.', 422);
  } catch (e) {
    if (e instanceof ConflictError) return fail(e.message, 409);
    return handleError(e);
  }
}

class ConflictError extends Error {}

export const GET = async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    await requireUser();
    const { id } = await params;
    const booking = await db.booking.findUnique({
      where: { id },
      include: { service: true, customer: true, transaction: { include: { payments: true } } },
    });
    if (!booking) return fail('Agendamento não encontrado.', 404);
    return ok({ booking });
  } catch (e) {
    return handleError(e);
  }
};
