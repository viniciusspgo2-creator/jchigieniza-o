import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { businessHoursSchema, blockingSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/** GET /api/admin/hours — regras da semana + folgas futuras. */
export async function GET() {
  try {
    await requireUser();
    const rules = await db.businessHours.findMany({ orderBy: { weekday: 'asc' } });
    const today = new Date().toISOString().slice(0, 10);
    const blocks = await db.dayBlocking.findMany({ where: { date: { gte: today } }, orderBy: { date: 'asc' } });
    return ok({ rules, blocks });
  } catch (e) {
    return handleError(e);
  }
}

/** PUT /api/admin/hours — salva as 7 regras de horário. */
export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = await parseBody(req, businessHoursSchema);
    if ('error' in parsed) return parsed.error;

    for (const rule of parsed.data.rules) {
      await db.businessHours.upsert({
        where: { weekday: rule.weekday },
        update: {
          active: rule.active,
          openTime: rule.openTime || null,
          closeTime: rule.closeTime || null,
          slotMinutes: rule.slotMinutes,
          capacityPerSlot: rule.capacityPerSlot,
          breakStart: rule.breakStart || null,
          breakEnd: rule.breakEnd || null,
        },
        create: {
          weekday: rule.weekday,
          active: rule.active,
          openTime: rule.openTime || null,
          closeTime: rule.closeTime || null,
          slotMinutes: rule.slotMinutes,
          capacityPerSlot: rule.capacityPerSlot,
          breakStart: rule.breakStart || null,
          breakEnd: rule.breakEnd || null,
        },
      });
    }
    await audit({ user, action: 'UPDATE', entity: 'BusinessHours' });
    return ok({ saved: true });
  } catch (e) {
    return handleError(e);
  }
}

/** POST /api/admin/hours — cria folga/bloqueio. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = await parseBody(req, blockingSchema);
    if ('error' in parsed) return parsed.error;
    const { date, timeSlot, reason } = parsed.data;

    const existing = await db.dayBlocking.findFirst({ where: { date, timeSlot: timeSlot ?? null } });
    const block = existing
      ? await db.dayBlocking.update({ where: { id: existing.id }, data: { reason: reason || null } })
      : await db.dayBlocking.create({ data: { date, timeSlot: timeSlot || null, reason: reason || null, createdBy: user.id } });
    await audit({ user, action: 'CREATE', entity: 'DayBlocking', entityId: block.id, details: { date, timeSlot } });
    return ok({ block }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
