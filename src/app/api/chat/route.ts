import { NextRequest } from 'next/server';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { chatAskSchema } from '@/lib/validation';
import { answerQuestion } from '@/lib/chat-engine';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/** POST /api/chat — assistente do site (FAQ + fallback). */
export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const parsed = await parseBody(req, chatAskSchema);
    if ('error' in parsed) return parsed.error;
    const { sessionId, message } = parsed.data;

    const rl = rateLimit(`chat:${ip}:${sessionId}`, 20, 10 * 60_000);
    if (!rl.ok) {
      return fail('Muitas mensagens seguidas. Aguarde um instante ou chame no WhatsApp (62) 99157-9369.', 429);
    }

    const result = await answerQuestion(sessionId, message);
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
