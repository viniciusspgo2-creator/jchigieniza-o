import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { customerSchema, normalizePhone } from '@/lib/validation';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/** GET /api/admin/customers?q=&archived= */
export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const url = new URL(req.url);
    const q = url.searchParams.get('q');
    const archived = url.searchParams.get('archived') === '1';

    const where: Record<string, unknown> = { archived };
    if (q) {
      where.OR = [{ name: { contains: q } }, { phone: { contains: q } }, { email: { contains: q } }];
    }
    const customers = await db.customer.findMany({
      where,
      include: { _count: { select: { bookings: true, transactions: true } } },
      orderBy: { name: 'asc' },
      take: 200,
    });
    return ok({ customers });
  } catch (e) {
    return handleError(e);
  }
}

/** POST /api/admin/customers */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = await parseBody(req, customerSchema);
    if ('error' in parsed) return parsed.error;
    const data = parsed.data;

    const phone = normalizePhone(data.phone);
    const existing = await db.customer.findUnique({ where: { phone } });
    if (existing) return fail('Já existe um cliente com esse telefone.', 409, { customerId: existing.id });

    const customer = await db.customer.create({
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
      },
    });
    await audit({ user, action: 'CREATE', entity: 'Customer', entityId: customer.id, details: { name: customer.name } });
    return ok({ customer }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
