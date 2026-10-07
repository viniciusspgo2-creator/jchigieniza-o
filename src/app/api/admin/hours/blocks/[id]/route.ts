import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, fail, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/** DELETE /api/admin/hours/blocks/[id] — remove folga/bloqueio de agenda. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const block = await db.dayBlocking.findUnique({ where: { id } });
    if (!block) return fail('Bloqueio não encontrado.', 404);
    await db.dayBlocking.delete({ where: { id } });
    await audit({ user, action: 'DELETE', entity: 'DayBlocking', entityId: id, details: { date: block.date, timeSlot: block.timeSlot } });
    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
