import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { supplierSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const url = new URL(req.url);
    const q = url.searchParams.get('q');
    const archived = url.searchParams.get('archived') === '1';
    const where: Record<string, unknown> = { archived };
    if (q) where.OR = [{ name: { contains: q } }, { products: { contains: q } }];
    const suppliers = await db.supplier.findMany({
      where,
      include: { _count: { select: { inventoryItems: true, transactions: true } } },
      orderBy: { name: 'asc' },
      take: 200,
    });
    return ok({ suppliers });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = await parseBody(req, supplierSchema);
    if ('error' in parsed) return parsed.error;
    const data = parsed.data;

    const dup = await db.supplier.findFirst({ where: { name: { contains: data.name }, archived: false } });
    if (dup && dup.name.toLowerCase() === data.name.toLowerCase()) {
      return fail('Já existe um fornecedor com esse nome.', 409, { supplierId: dup.id });
    }

    const supplier = await db.supplier.create({
      data: {
        name: data.name,
        contactName: data.contactName || null,
        phone: data.phone || null,
        email: data.email || null,
        products: data.products || null,
        notes: data.notes || null,
      },
    });
    await audit({ user, action: 'CREATE', entity: 'Supplier', entityId: supplier.id });
    return ok({ supplier }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
