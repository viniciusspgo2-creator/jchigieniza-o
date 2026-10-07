import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { postSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';
import { sanitizeMarkdown } from '../route';

export const dynamic = 'force-dynamic';

const patchSchema = postSchema.partial().extend({
  unpublish: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    const post = await db.post.findUnique({ where: { id } });
    if (!post) return fail('Artigo não encontrado.', 404);
    return ok({ post });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const parsed = await parseBody(req, patchSchema);
    if ('error' in parsed) return parsed.error;
    const { unpublish, ...data } = parsed.data;

    const current = await db.post.findUnique({ where: { id } });
    if (!current) return fail('Artigo não encontrado.', 404);

    if (data.slug && data.slug !== current.slug) {
      const dup = await db.post.findUnique({ where: { slug: data.slug } });
      if (dup) return fail('Já existe um artigo com esse slug.', 409);
    }

    const willPublish = unpublish ? false : data.status === 'PUBLISHED';
    const post = await db.post.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content ? sanitizeMarkdown(data.content) : undefined,
        metaTitle: data.metaTitle === '' ? null : data.metaTitle,
        metaDescription: data.metaDescription === '' ? null : data.metaDescription,
        coverImage: data.coverImage === '' ? null : data.coverImage,
        coverAlt: data.coverAlt == null ? null : String(data.coverAlt),
        authorName: data.authorName || undefined,
        status: unpublish ? 'DRAFT' : data.status,
        publishedAt: willPublish && !current.publishedAt ? new Date() : current.publishedAt,
      },
    });
    await audit({ user, action: willPublish ? 'PUBLISH' : 'UPDATE', entity: 'Post', entityId: id, details: { slug: post.slug } });
    return ok({ post });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await db.post.delete({ where: { id } });
    await audit({ user, action: 'DELETE', entity: 'Post', entityId: id });
    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
