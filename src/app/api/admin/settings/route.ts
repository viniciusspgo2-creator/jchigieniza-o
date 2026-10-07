import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireUser, requireAdmin } from '@/lib/auth';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * Configurações gerais em chave/valor:
 * - seo: título/descrição/keywords globais
 * - flags: exibição de "sem taxa de deslocamento", seção resultados
 * - backup/export: documentados no README
 */
const ALLOWED_KEYS = ['seo', 'flags'];

const schema = z.object({
  key: z.string().trim().refine((k) => ALLOWED_KEYS.includes(k), 'Chave de configuração não permitida.'),
  value: z.record(z.string(), z.unknown()),
});

export async function GET() {
  try {
    await requireUser();
    const rows = await db.setting.findMany({ where: { key: { in: ALLOWED_KEYS } } });
    const settings: Record<string, unknown> = {};
    for (const r of rows) {
      try { settings[r.key] = JSON.parse(r.value); } catch { /* ignora */ }
    }
    return ok({ settings });
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAdmin();
    const parsed = await parseBody(req, schema);
    if ('error' in parsed) return parsed.error;
    const { key, value } = parsed.data;

    await db.setting.upsert({
      where: { key },
      update: { value: JSON.stringify(value) },
      create: { key, value: JSON.stringify(value) },
    });
    await audit({ user, action: 'UPDATE', entity: 'Setting', entityId: key });
    return ok({ saved: true });
  } catch (e) {
    return handleError(e);
  }
}
