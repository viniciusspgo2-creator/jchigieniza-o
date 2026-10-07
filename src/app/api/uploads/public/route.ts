import { NextRequest } from 'next/server';
import sharp from 'sharp';
import { ok, fail, handleError } from '@/lib/api';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_SIZE = 4 * 1024 * 1024; // 4MB (Vercel limita o corpo da requisição a 4,5MB)
const MAX_FILES = 4;

/**
 * POST /api/uploads/public — upload de fotos OPCIONAIS do formulário de agendamento.
 * Validação estrita: multipart, até 4 arquivos, JPEG/PNG/WebP, 4MB cada.
 * Imagens reprocessadas com sharp (remove EXIF, normaliza) e gravadas NO BANCO
 * (tabela StoredFile) — nunca em disco, para compatibilidade com Vercel/Neon.
 * Nunca entram automaticamente na galeria pública.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`upload:${ip}`, 10, 15 * 60_000);
    if (!rl.ok) return fail('Muitos envios. Aguarde alguns minutos.', 429);

    const form = await req.formData();
    const files = form.getAll('files').filter((f): f is File => f instanceof File);
    if (files.length === 0) return fail('Nenhuma foto enviada.', 422);
    if (files.length > MAX_FILES) return fail(`Envie no máximo ${MAX_FILES} fotos.`, 422);

    const urls: string[] = [];
    for (const file of files) {
      if (file.size > MAX_SIZE) return fail('Cada foto deve ter até 4MB.', 422);
      const okType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      if (!okType) return fail('Formatos aceitos: JPEG, PNG ou WebP.', 422);

      const buf = Buffer.from(await file.arrayBuffer());
      // Verificação real do conteúdo (magic bytes) via sharp
      let processed: Buffer;
      try {
        processed = await sharp(buf).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      } catch {
        return fail('Arquivo de imagem inválido ou corrompido.', 422);
      }
      const name = `foto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
      await db.storedFile.create({
        data: { name, scope: 'public', mime: 'image/webp', size: processed.byteLength, data: new Uint8Array(processed) },
      });
      urls.push(`/api/uploads/public/${name}`);
    }

    return ok({ urls }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
