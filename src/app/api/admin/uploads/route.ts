import { NextRequest } from 'next/server';
import sharp from 'sharp';
import { ok, fail, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_SIZE = 4 * 1024 * 1024; // 4MB (Vercel limita o corpo da requisição a 4,5MB)

/**
 * POST /api/admin/uploads — upload de imagens do painel (galeria, blog, logo).
 * O arquivo processado (sharp → WebP) é gravado NO BANCO (tabela StoredFile),
 * não em disco: serverless (Vercel) não possui filesystem persistente.
 * A imagem fica disponível em /api/uploads/admin/<nome>.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return fail('Envie um arquivo.', 422);
    if (file.size > MAX_SIZE) return fail('A imagem deve ter até 4MB.', 422);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return fail('Formatos aceitos: JPEG, PNG ou WebP.', 422);
    }

    const buf = Buffer.from(await file.arrayBuffer());
    let processed: Buffer;
    try {
      processed = await sharp(buf).rotate().resize({ width: 1800, withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
    } catch {
      return fail('Arquivo de imagem inválido ou corrompido.', 422);
    }

    const name = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
    await db.storedFile.create({
      data: { name, scope: 'admin', mime: 'image/webp', size: processed.byteLength, data: new Uint8Array(processed) },
    });

    await audit({ user, action: 'UPLOAD', entity: 'File', entityId: name });
    return ok({ url: `/api/uploads/admin/${name}` }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
