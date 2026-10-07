import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/uploads/<pasta>/<arquivo> — serve imagens enviadas.
 * Os arquivos vivem NO BANCO (tabela StoredFile), não em disco: ambiente
 * serverless (Vercel + Neon) não tem filesystem persistente.
 * Ex.: /api/uploads/admin/img-1717...-ab12cd.webp
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ file: string[] }> }) {
  const { file } = await params;
  if (file.length !== 2) return new NextResponse('Não encontrado', { status: 404 });
  const [scope, name] = file;
  if (!['admin', 'public'].includes(scope) || name.includes('..') || name.includes('/') || name.includes('\\')) {
    return new NextResponse('Inválido', { status: 400 });
  }
  try {
    const row = await db.storedFile.findUnique({ where: { name } });
    if (!row || row.scope !== scope) return new NextResponse('Não encontrado', { status: 404 });
    return new NextResponse(new Uint8Array(row.data), {
      headers: {
        'Content-Type': row.mime || 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('Erro ao carregar arquivo', { status: 500 });
  }
}
