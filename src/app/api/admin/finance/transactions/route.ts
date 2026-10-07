import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireUser, requireAdmin } from '@/lib/auth';
import { transactionSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/finance/transactions — lançamentos com filtros.
 * status: PENDENTE (previsto) | PAGO (liquidado) | CANCELADO
 */
export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const customerId = url.searchParams.get('customerId');
    const supplierId = url.searchParams.get('supplierId');
    const categoryId = url.searchParams.get('categoryId');
    const q = url.searchParams.get('q');
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
    const perPage = Math.min(200, Math.max(10, Number(url.searchParams.get('perPage') ?? '50')));

    const where: Record<string, unknown> = {};
    if (status && ['PENDENTE', 'PAGO', 'CANCELADO'].includes(status)) where.status = status;
    if (type && ['INCOME', 'EXPENSE'].includes(type)) where.type = type;
    if (from && to) where.dueDate = { gte: from, lte: to };
    else if (from) where.dueDate = { gte: from };
    else if (to) where.dueDate = { lte: to };
    if (customerId) where.customerId = customerId;
    if (supplierId) where.supplierId = supplierId;
    if (categoryId) where.categoryId = categoryId;
    if (q) where.description = { contains: q };

    const [total, transactions] = await Promise.all([
      db.transaction.count({ where }),
      db.transaction.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          account: { select: { id: true, name: true } },
          paymentMethod: { select: { id: true, name: true } },
          booking: { select: { id: true, protocol: true } },
          payments: { orderBy: { paidAt: 'asc' } },
        },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return ok({ total, page, perPage, transactions });
  } catch (e) {
    return handleError(e);
  }
}

/**
 * POST /api/admin/finance/transactions — cria lançamento.
 * Despesas: apenas ADMIN por padrão (operacional sem acesso financeiro).
 * Suporta parcelamento: cria N lançamentos com groupId.
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const parsed = await parseBody(req, transactionSchema);
    if ('error' in parsed) return parsed.error;
    const data = parsed.data;

    const installments = data.installments ?? 1;
    if (installments > 1 && !data.dueDate) return fail('Informe a data do primeiro vencimento para parcelar.', 422);

    const groupId = installments > 1 ? `grp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` : null;
    const perInstallment = Math.floor(data.amountCents / installments);
    const remainder = data.amountCents - perInstallment * installments;

    const created: Awaited<ReturnType<typeof db.transaction.create>>[] = [];
    for (let i = 1; i <= installments; i++) {
      const amount = perInstallment + (i <= remainder ? 1 : 0);
      const dueDate = data.dueDate ? shiftMonth(data.dueDate, i - 1) : null;
      created.push(
        await db.transaction.create({
          data: {
            type: data.type,
            kind: data.type === 'INCOME' ? 'RECEITA_AVULSA' : 'DESPESA',
            description: installments > 1 ? `${data.description} (${i}/${installments})` : data.description,
            amountCents: amount,
            status: 'PENDENTE',
            dueDate,
            customerId: data.customerId || null,
            supplierId: data.supplierId || null,
            categoryId: data.categoryId || null,
            accountId: data.accountId || null,
            paymentMethodId: data.paymentMethodId || null,
            installments,
            installmentNo: i,
            groupId,
            notes: data.notes || null,
          },
        }),
      );
    }

    await audit({ user: await requireAdmin(), action: 'CREATE', entity: 'Transaction', details: { count: created.length, amountCents: data.amountCents, type: data.type } });
    return ok({ transactions: created }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

/** Soma n meses mantendo o dia (clamp no fim do mês). */
function shiftMonth(dateStr: string, add: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const base = new Date(Date.UTC(y, m - 1 + add, 1));
  const lastDay = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
  const day = Math.min(d, lastDay);
  return `${base.getUTCFullYear()}-${String(base.getUTCMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
