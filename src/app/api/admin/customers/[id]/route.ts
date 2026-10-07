import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { customerSchema, normalizePhone } from '@/lib/validation';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/** GET /api/admin/customers/[id] — ficha completa com histórico. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        bookings: {
          include: { service: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        transactions: { include: { payments: true }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!customer) return fail('Cliente não encontrado.', 404);

    const paidCents = customer.transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((acc, t) => acc + t.payments.reduce((a, p) => a + p.amountCents, 0), 0);
    const openCents = customer.transactions
      .filter((t) => t.type === 'INCOME' && t.status === 'PENDENTE')
      .reduce((acc, t) => acc + (t.amountCents - t.payments.reduce((a, p) => a + p.amountCents, 0)), 0);

    return ok({ customer, paidCents, openCents });
  } catch (e) {
    return handleError(e);
  }
}

/** PATCH /api/admin/customers/[id] */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const parsed = await parseBody(req, customerSchema);
    if ('error' in parsed) return parsed.error;
    const data = parsed.data;

    const phone = normalizePhone(data.phone);
    const dup = await db.customer.findFirst({ where: { phone, id: { not: id } } });
    if (dup) return fail('Outro cliente já usa esse telefone.', 409);

    const customer = await db.customer.update({
      where: { id },
      data: {
        name: data.name,
        phone,
        email: data.email || null,
        addressStreet: data.addressStreet || null,
        addressDistrict: data.addressDistrict || null,
        addressCity: data.addressCity || null,
        addressState: data.addressState || null,
        addressZip: data.addressZip || null,
        addressRef: data.addressRef || null,
        notes: data.notes || null,
        archived: data.archived ?? false,
      },
    });
    await audit({ user, action: 'UPDATE', entity: 'Customer', entityId: id, details: { name: customer.name } });
    return ok({ customer });
  } catch (e) {
    return handleError(e);
  }
}
