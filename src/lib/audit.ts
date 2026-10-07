import 'server-only';
import { db } from './db';
import type { SessionUser } from './auth';

/** Registra alteração administrativa relevante. Nunca lança para não interromper a operação principal. */
export async function audit(params: {
  user?: SessionUser | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: unknown;
}) {
  try {
    await db.auditLog.create({
      data: {
        userId: params.user?.id ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        details: params.details === undefined ? null : JSON.stringify(params.details).slice(0, 4000),
      },
    });
  } catch (e) {
    console.error('[audit] falha ao registrar', e);
  }
}

export async function notify(params: { type: string; title: string; message: string; link?: string; bookingId?: string }) {
  try {
    await db.notification.create({
      data: {
        type: params.type,
        title: params.title,
        message: params.message.slice(0, 500),
        link: params.link ?? null,
        bookingId: params.bookingId ?? null,
      },
    });
  } catch (e) {
    console.error('[notify] falha ao criar notificação', e);
  }
}
