import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, handleError } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** GET /api/admin/audit — histórico de alterações administrativas (somente ADMIN). */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const page = Math.max(1, Number(new URL(req.url).searchParams.get('page') ?? '1'));
    const logs = await db.auditLog.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      skip: (page - 1) * 50,
    });
    return ok({ logs, page });
  } catch (e) {
    return handleError(e);
  }
}
