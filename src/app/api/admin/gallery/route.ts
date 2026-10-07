import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const gallerySchema = z.object({
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().max(400).optional().nullable().or(z.literal('')),
  category: z.enum(['casa', 'infantil', 'veicular', 'protecao']).optional().nullable(),
  image: z.string().trim().min(1).max(400),
  imageAlt: z.string().trim().min(5).max(300),
  beforeImage: z.string().trim().max(400).optional().nullable().or(z.literal('')),
  afterImage: z.string().trim().max(400).optional().nullable().or(z.literal('')),
  isComparator: z.boolean().optional(),
  active: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
});

export async function GET() {
  try {
    await requireUser();
    const items = await db.galleryItem.findMany({ orderBy: { sortOrder: 'asc' } });
    return ok({ items });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = await parseBody(req, gallerySchema);
    if ('error' in parsed) return parsed.error;
    const data = parsed.data;

    const item = await db.galleryItem.create({
      data: {
        title: data.title,
        description: data.description || null,
        category: data.category ?? null,
        image: data.image,
        imageAlt: data.imageAlt,
        beforeImage: data.beforeImage || null,
        afterImage: data.afterImage || null,
        isComparator: data.isComparator ?? false,
        active: data.active ?? true,
        sortOrder: data.sortOrder ?? 99,
      },
    });
    await audit({ user, action: 'CREATE', entity: 'GalleryItem', entityId: item.id });
    return ok({ item }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
