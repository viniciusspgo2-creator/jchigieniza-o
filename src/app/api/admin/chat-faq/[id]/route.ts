import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  question: z.string().trim().min(5).max(300).optional(),
  answer: z.string().trim().min(5).max(2000).optional(),
  keywords: z.string().trim().min(2).max(400).optional(),
  showOnSite: z.boolean().optional(),
  active: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const parsed = await parseBody(req, patchSchema);
    if ('error' in parsed) return parsed.error;
    const faq = await db.chatFaq.update({ where: { id }, data: parsed.data });
    await audit({ user, action: 'UPDATE', entity: 'ChatFaq', entityId: id });
    return ok({ faq });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await db.chatFaq.delete({ where: { id } });
    await audit({ user, action: 'DELETE', entity: 'ChatFaq', entityId: id });
    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
