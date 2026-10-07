import { db } from '@/lib/db';
import { ok, handleError } from '@/lib/api';

export const dynamic = 'force-dynamic';

/** GET /api/servicos-publicos — lista de serviços ativos e visíveis (para o formulário público). */
export async function GET() {
  try {
    const services = await db.service.findMany({
      where: { active: true, visibleOnSite: true },
      select: { slug: true, name: true },
      orderBy: { sortOrder: 'asc' },
    });
    return ok({ services });
  } catch (e) {
    return handleError(e);
  }
}
