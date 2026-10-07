import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { serviceSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const patchSchema = serviceSchema.partial().extend({
  restore: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const parsed = await parseBody(req, patchSchema);
    if ('error' in parsed) return parsed.error;
    const { restore, ...data } = parsed.data;

    const service = await db.service.update({
      where: { id },
      data: {
        ...data,
        ...(data.slug ? {} : {}),
        ...(restore ? { active: true } : {}),
        whatsappMsg: data.whatsappMsg === '' ? null : data.whatsappMsg,
      },
    });
    await audit({ user, action: 'UPDATE', entity: 'Service', entityId: id, details: data });
    return ok({ service });
  } catch (e) {
    return handleError(e);
  }
}
