import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, fail, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** GET /api/admin/notifications?unread=1 */
export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const unread = new URL(req.url).searchParams.get('unread') === '1';
    const notifications = await db.notification.findMany({
      where: unread ? { read: false } : {},
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return ok({ notifications, unreadCount: await db.notification.count({ where: { read: false } }) });
  } catch (e) {
    return handleError(e);
  }
}

/** PATCH /api/admin/notifications?id=all|uuid */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const id = (body as { id?: string }).id;
    if (id === 'all') {
      await db.notification.updateMany({ where: { read: false }, data: { read: true, readBy: user.name, readAt: new Date() } });
      return ok({ markedAll: true });
    }
    if (!id) return fail('Informe o id da notificação.', 422);
    await db.notification.update({ where: { id }, data: { read: true, readBy: user.name, readAt: new Date() } });
    return ok({ marked: true });
  } catch (e) {
    return handleError(e);
  }
}
