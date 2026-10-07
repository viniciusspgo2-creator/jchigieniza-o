import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, fail, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/** DELETE /api/admin/hours/blocks?id= — remove folga/bloqueio. */
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser();
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return fail('Informe o id do bloqueio.', 422);
    await db.dayBlocking.delete({ where: { id } });
    await audit({ user, action: 'DELETE', entity: 'DayBlocking', entityId: id });
    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
