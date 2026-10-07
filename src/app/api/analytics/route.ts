import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { analyticsEventSchema } from '@/lib/validation';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { ensureVisitorId } from '@/lib/auth';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const BOT_UA = /bot|crawler|spider|crawling|headless|lighthouse|preview/i;

/**
 * POST /api/analytics — coleta first-party de pageviews e eventos de conversão.
 * Sem dados pessoais: apenas cookie anônimo (uuid), caminho, referrer e classe de dispositivo.
 * Acessos autenticados ao painel são ignorados.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (user) return ok({ skipped: true }); // não coleta acessos administrativos

    const ip = clientIp(req);
    const rl = rateLimit(`analytics:${ip}`, 120, 60_000);
    if (!rl.ok) return ok({ skipped: true });

    const url = new URL(req.url);
    const kind = url.searchParams.get('kind') === 'event' ? 'event' : 'pageview';

    const sessionId = await ensureVisitorId();
    const ua = req.headers.get('user-agent') ?? '';
    const isBot = BOT_UA.test(ua);
    if (isBot) return ok({ skipped: true });

    const device = /mobile|android|iphone/i.test(ua) ? 'mobile' : /tablet|ipad/i.test(ua) ? 'tablet' : 'desktop';

    if (kind === 'pageview') {
      const bodySchema = z.object({ path: z.string().max(200), referrer: z.string().max(300).optional() });
      const parsed = await parseBody(req, bodySchema);
      if ('error' in parsed) return parsed.error;
      const { path, referrer } = parsed.data;
      if (path.startsWith('/admin') || path.startsWith('/api')) return ok({ skipped: true });
      await db.pageView.create({
        data: { sessionId, path: path.slice(0, 200), referrer: referrer?.slice(0, 300) ?? null, device },
      });
      return ok({ recorded: true });
    }

    const parsed = await parseBody(req, analyticsEventSchema);
    if ('error' in parsed) return parsed.error;
    const { type, path, meta } = parsed.data;
    if (path?.startsWith('/admin')) return ok({ skipped: true });
    await db.analyticsEvent.create({
      data: { sessionId, type, path: path?.slice(0, 200) ?? null, meta: meta?.slice(0, 200) ?? null },
    });
    return ok({ recorded: true });
  } catch (e) {
    return handleError(e);
  }
}
