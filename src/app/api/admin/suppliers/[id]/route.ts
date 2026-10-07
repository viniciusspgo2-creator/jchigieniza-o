import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { supplierSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const parsed = await parseBody(req, supplierSchema);
    if ('error' in parsed) return parsed.error;
    const data = parsed.data;

    const supplier = await db.supplier.update({
      where: { id },
      data: {
        name: data.name,
        contactName: data.contactName || null,
        phone: data.phone || null,
        email: data.email || null,
        products: data.products || null,
        notes: data.notes || null,
        archived: data.archived ?? false,
      },
    });
    await audit({ user, action: 'UPDATE', entity: 'Supplier', entityId: id });
    return ok({ supplier });
  } catch (e) {
    return handleError(e);
  }
}
