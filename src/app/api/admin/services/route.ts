import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { serviceSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireUser();
    const categories = await db.serviceCategory.findMany({
      include: { services: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });
    return ok({ categories });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = await parseBody(req, serviceSchema);
    if ('error' in parsed) return parsed.error;
    const data = parsed.data;

    const dup = await db.service.findUnique({ where: { slug: data.slug } });
    if (dup) return fail('Já existe um serviço com esse slug.', 409);

    const service = await db.service.create({ data: { ...data, visibleOnSite: data.visibleOnSite ?? true, active: data.active ?? true, sortOrder: data.sortOrder ?? 0 } });
    await audit({ user, action: 'CREATE', entity: 'Service', entityId: service.id, details: { name: service.name } });
    return ok({ service }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
