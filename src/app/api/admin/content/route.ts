import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireUser, requireAdmin } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { getSiteData } from '@/lib/site-content';

export const dynamic = 'force-dynamic';

/** GET /api/admin/content — todos os blocos editáveis (publicado + rascunho). */
export async function GET() {
  try {
    await requireUser();
    const rows = await db.siteContent.findMany();
    const site = await getSiteData();
    const drafts: Record<string, unknown> = {};
    for (const row of rows) {
      if (row.draft) {
        try { drafts[row.key] = JSON.parse(row.draft); } catch { /* ignora */ }
      }
    }
    return ok({ published: site, drafts, meta: rows.map((r) => ({ key: r.key, updatedAt: r.updatedAt, updatedBy: r.updatedBy })) });
  } catch (e) {
    return handleError(e);
  }
}

const putSchema = z.object({
  key: z.string().trim().min(2).max(60),
  value: z.record(z.string(), z.unknown()),
  publish: z.boolean().optional(),
});

/**
 * PUT /api/admin/content — salva rascunho e/ou publica um bloco de conteúdo.
 * `publish: true` copia o valor para publicação imediata; senão fica em rascunho.
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = await parseBody(req, putSchema);
    if ('error' in parsed) return parsed.error;
    const { key, value, publish } = parsed.data;

    const existing = await db.siteContent.findUnique({ where: { key } });
    const current = existing?.value ? JSON.parse(existing.value) : {};
    const merged = { ...current, ...value };

    const data = {
      value: publish ? JSON.stringify(merged) : existing?.value ?? JSON.stringify({}),
      draft: publish ? null : JSON.stringify(merged),
      updatedBy: user.name,
    };

    const row = await db.siteContent.upsert({
      where: { key },
      update: data,
      create: { key, ...data },
    });

    await audit({ user, action: publish ? 'PUBLISH' : 'DRAFT', entity: 'SiteContent', entityId: key, details: { keys: Object.keys(value) } });
    return ok({ content: { key: row.key, updatedAt: row.updatedAt }, published: Boolean(publish) });
  } catch (e) {
    return handleError(e);
  }
}

/** DELETE /api/admin/content?key= — descarta rascunho (voltar ao publicado). */
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAdmin();
    const key = new URL(req.url).searchParams.get('key');
    if (!key) return fail('Informe a chave do bloco.', 422);
    await db.siteContent.updateMany({ where: { key }, data: { draft: null } });
    await audit({ user, action: 'DISCARD_DRAFT', entity: 'SiteContent', entityId: key });
    return ok({ discarded: true });
  } catch (e) {
    return handleError(e);
  }
}
