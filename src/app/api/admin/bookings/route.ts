import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, handleError, fail } from '@/lib/api';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const STATUSES = ['SOLICITADO', 'EM_ANALISE', 'CONFIRMADO', 'EM_ATENDIMENTO', 'CONCLUIDO', 'CANCELADO'];

/** GET /api/admin/bookings — lista com filtros. Operador vê tudo; dados sensíveis mínimos no log. */
export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const q = url.searchParams.get('q');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
    const perPage = Math.min(100, Math.max(10, Number(url.searchParams.get('perPage') ?? '30')));

    const where: Record<string, unknown> = {};
    if (status && STATUSES.includes(status)) where.status = status;
    if (from && to) where.preferredDate = { gte: from, lte: to };
    else if (from) where.preferredDate = { gte: from };
    else if (to) where.preferredDate = { lte: to };
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { phone: { contains: q } },
        { protocol: { contains: q.toUpperCase() } },
      ];
    }

    const [total, bookings] = await Promise.all([
      db.booking.count({ where }),
      db.booking.findMany({
        where,
        include: {
          service: { select: { name: true, slug: true } },
          customer: { select: { id: true } },
          transaction: { select: { id: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return ok({ total, page, perPage, bookings });
  } catch (e) {
    return handleError(e);
  }
}

const patchSchema = {
  // validado no [id]/route.ts
};

export { fail };
