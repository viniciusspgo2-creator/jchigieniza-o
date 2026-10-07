import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const schema = z.object({
  name: z.string().trim().min(3).max(80),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  description: z.string().trim().max(400).optional().nullable(),
  icon: z.string().trim().max(40).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).max(99).optional(),
  active: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = await parseBody(req, schema);
    if ('error' in parsed) return parsed.error;
    const dup = await db.serviceCategory.findUnique({ where: { slug: parsed.data.slug } });
    if (dup) return fail('Categoria com esse slug já existe.', 409);
    const category = await db.serviceCategory.create({ data: { ...parsed.data, sortOrder: parsed.data.sortOrder ?? 9 } });
    await audit({ user, action: 'CREATE', entity: 'ServiceCategory', entityId: category.id });
    return ok({ category }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
