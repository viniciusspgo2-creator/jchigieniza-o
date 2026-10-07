import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  title: z.string().trim().min(3).max(140).optional(),
  description: z.string().trim().max(400).optional().nullable().or(z.literal('')),
  category: z.enum(['casa', 'infantil', 'veicular', 'protecao']).optional().nullable(),
  image: z.string().trim().max(400).optional(),
  imageAlt: z.string().trim().max(300).optional(),
  beforeImage: z.string().trim().max(400).optional().nullable().or(z.literal('')),
  afterImage: z.string().trim().max(400).optional().nullable().or(z.literal('')),
  isComparator: z.boolean().optional(),
  active: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const parsed = await parseBody(req, patchSchema);
    if ('error' in parsed) return parsed.error;
    const data = parsed.data;

    const item = await db.galleryItem.update({
      where: { id },
      data: {
        ...data,
        description: data.description === '' ? null : data.description,
        beforeImage: data.beforeImage === '' ? null : data.beforeImage,
        afterImage: data.afterImage === '' ? null : data.afterImage,
      },
    });
    await audit({ user, action: 'UPDATE', entity: 'GalleryItem', entityId: id });
    return ok({ item });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await db.galleryItem.delete({ where: { id } });
    await audit({ user, action: 'DELETE', entity: 'GalleryItem', entityId: id });
    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
