import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { postSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * Sanitização de conteúdo do blog: o markdown é renderizado com react-markdown
 * SEM rehype-raw, ou seja, HTML cru é escapado (defesa contra XSS).
 * Aqui removemos também padrões perigosos explícitos.
 */
export function sanitizeMarkdown(md: string): string {
  return md
    .replace(/<\s*script/gi, '&lt;script')
    .replace(/<\s*iframe/gi, '&lt;iframe')
    .replace(/<\s*object/gi, '&lt;object')
    .replace(/<\s*embed/gi, '&lt;embed')
    .replace(/javascript\s*:/gi, 'javascript-blocked:')
    .replace(/on\w+\s*=/gi, 'data-blocked=');
}

export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const where: Record<string, unknown> = {};
    if (status && ['DRAFT', 'PUBLISHED'].includes(status)) where.status = status;
    const posts = await db.post.findMany({
      where,
      select: { id: true, title: true, slug: true, excerpt: true, status: true, publishedAt: true, updatedAt: true, coverImage: true, authorName: true },
      orderBy: { updatedAt: 'desc' },
    });
    return ok({ posts });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = await parseBody(req, postSchema);
    if ('error' in parsed) return parsed.error;
    const data = parsed.data;

    const dup = await db.post.findUnique({ where: { slug: data.slug } });
    if (dup) return fail('Já existe um artigo com esse slug.', 409);

    const post = await db.post.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: sanitizeMarkdown(data.content),
        metaTitle: data.metaTitle || data.title,
        metaDescription: data.metaDescription || data.excerpt.slice(0, 170),
        coverImage: data.coverImage || null,
        coverAlt: data.coverAlt || data.title,
        authorName: data.authorName || 'Equipe JC Lavagem a Seco',
        status: data.status,
        publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
      },
    });
    await audit({ user, action: 'CREATE', entity: 'Post', entityId: post.id, details: { slug: post.slug, status: post.status } });
    return ok({ post: { id: post.id, slug: post.slug } }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
