import { db } from '@/lib/db';
import { ok, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { todaySP } from '@/lib/tz';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/dashboard — métricas 100% reais do banco.
 * Sem dados → valores zerados/estados vazios (nunca números fictícios).
 */
export async function GET() {
  try {
    await requireUser();
    const now = new Date();
    const today = todaySP();

    const d30 = new Date(now.getTime() - 30 * 24 * 3600_000);
    const d7 = new Date(now.getTime() - 7 * 24 * 3600_000);
    const d1 = new Date(now.getTime() - 1 * 24 * 3600_000);

    const [
      views30,
      views7,
      views1,
      waClicks30,
      bookingEvents30,
      bookingsByStatus,
      bookingsTotal,
      bookingsToday,
      upcoming,
      received30,
      pendingReceivable,
      overdueReceivable,
      overduePayable,
      lowStock,
      unreadNotifications,
      visitors30,
    ] = await Promise.all([
      db.pageView.count({ where: { createdAt: { gte: d30 } } }),
      db.pageView.count({ where: { createdAt: { gte: d7 } } }),
      db.pageView.count({ where: { createdAt: { gte: d1 } } }),
      db.analyticsEvent.count({ where: { type: 'WHATSAPP_CLICK', createdAt: { gte: d30 } } }),
      db.analyticsEvent.count({ where: { type: 'BOOKING_SUBMIT', createdAt: { gte: d30 } } }),
      db.booking.groupBy({ by: ['status'], _count: { _all: true } }),
      db.booking.count(),
      db.booking.count({ where: { preferredDate: today, status: { in: ['CONFIRMADO', 'EM_ATENDIMENTO'] } } }),
      db.booking.findMany({
        where: { status: { in: ['CONFIRMADO', 'EM_ATENDIMENTO'] }, preferredDate: { gte: today } },
        include: { service: { select: { name: true } } },
        orderBy: [{ preferredDate: 'asc' }, { timeSlot: 'asc' }],
        take: 8,
      }),
      db.transactionPayment.aggregate({ _sum: { amountCents: true }, where: { transaction: { type: 'INCOME' }, paidAt: { gte: d30 } } }),
      db.transaction.aggregate({
        _sum: { amountCents: true },
        where: { type: 'INCOME', status: 'PENDENTE' },
      }),
      db.transaction.findMany({
        where: { type: 'INCOME', status: 'PENDENTE', dueDate: { lt: today } },
        include: { payments: true, customer: { select: { name: true } } },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),
      db.transaction.findMany({
        where: { type: 'EXPENSE', status: 'PENDENTE', dueDate: { lt: today } },
        include: { payments: true, supplier: { select: { name: true } } },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),
      db.inventoryItem.findMany({
        where: { archived: false },
        orderBy: { name: 'asc' },
      }).then((items) => items.filter((i) => i.quantity < i.minQuantity)),
      db.notification.count({ where: { read: false } }),
      db.pageView.findMany({
        where: { createdAt: { gte: d30 } },
        select: { sessionId: true },
        distinct: ['sessionId'],
      }),
    ]);

    const paidSum = (t: { amountCents: number; payments: { amountCents: number }[] }) =>
      t.amountCents - t.payments.reduce((a, p) => a + p.amountCents, 0);

    return ok({
      visits: { d1: views1, d7: views7, d30: views30, sessions30: visitors30.length },
      conversions: { whatsappClicks30: waClicks30, bookingSubmits30: bookingEvents30 },
      bookings: {
        byStatus: Object.fromEntries(bookingsByStatus.map((b) => [b.status, b._count._all])),
        total: bookingsTotal,
        today: bookingsToday,
        upcoming,
      },
      finance: {
        received30Cents: received30._sum.amountCents ?? 0,
        pendingReceivableCents: pendingReceivable._sum.amountCents ?? 0,
        overdueReceivables: overdueReceivable.map((t) => ({
          id: t.id, description: t.description, dueDate: t.dueDate, remainingCents: paidSum(t), customer: t.customer?.name ?? null,
        })),
        overduePayables: overduePayable.map((t) => ({
          id: t.id, description: t.description, dueDate: t.dueDate, remainingCents: paidSum(t), supplier: t.supplier?.name ?? null,
        })),
      },
      lowStock: lowStock.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, minQuantity: i.minQuantity, unit: i.unit })),
      unreadNotifications,
    });
  } catch (e) {
    return handleError(e);
  }
}
