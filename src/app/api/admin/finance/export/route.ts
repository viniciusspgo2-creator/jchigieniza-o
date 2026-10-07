import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleError } from '@/lib/api';

export const dynamic = 'force-dynamic';

/** GET /api/admin/finance/export?from=&to=&status=&type= — exportação CSV. */
export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const url = new URL(req.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');

    const where: Record<string, unknown> = {};
    if (from && to) where.dueDate = { gte: from, lte: to };
    else if (from) where.dueDate = { gte: from };
    else if (to) where.dueDate = { lte: to };
    if (status) where.status = status;
    if (type) where.type = type;

    const rows = await db.transaction.findMany({
      where,
      include: {
        customer: { select: { name: true } },
        supplier: { select: { name: true } },
        category: { select: { name: true } },
        payments: { orderBy: { paidAt: 'asc' } },
      },
      orderBy: [{ dueDate: 'asc' }],
      take: 5000,
    });

    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [
      ['id', 'tipo', 'descricao', 'status', 'vencimento', 'valor_centavos', 'pago_centavos', 'saldo_centavos', 'data_pagamento', 'cliente', 'fornecedor', 'categoria'].join(';'),
    ];
    for (const t of rows) {
      const paidCents = t.payments.reduce((a, p) => a + p.amountCents, 0);
      lines.push([
        t.id,
        t.type === 'INCOME' ? 'RECEITA' : 'DESPESA',
        t.description,
        t.status,
        t.dueDate ?? '',
        t.amountCents,
        paidCents,
        t.amountCents - paidCents,
        t.paidAt ? t.paidAt.toISOString().slice(0, 10) : '',
        t.customer?.name ?? '',
        t.supplier?.name ?? '',
        t.category?.name ?? '',
      ].map(esc).join(';'));
    }

    const csv = '\uFEFF' + lines.join('\n'); // BOM p/ Excel
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="financeiro-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
