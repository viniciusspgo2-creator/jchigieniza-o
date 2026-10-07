import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const faqSchema = z.object({
  question: z.string().trim().min(5).max(300),
  answer: z.string().trim().min(5).max(2000),
  keywords: z.string().trim().min(2).max(400),
  showOnSite: z.boolean().optional(),
  active: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
});

export async function GET() {
  try {
    await requireUser();
    const faqs = await db.chatFaq.findMany({ orderBy: { sortOrder: 'asc' } });
    return ok({ faqs });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = await parseBody(req, faqSchema);
    if ('error' in parsed) return parsed.error;
    const faq = await db.chatFaq.create({
      data: { ...parsed.data, showOnSite: parsed.data.showOnSite ?? true, active: parsed.data.active ?? true, sortOrder: parsed.data.sortOrder ?? 99 },
    });
    await audit({ user, action: 'CREATE', entity: 'ChatFaq', entityId: faq.id });
    return ok({ faq }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
