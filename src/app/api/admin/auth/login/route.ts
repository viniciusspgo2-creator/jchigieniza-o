import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { loginSchema } from '@/lib/validation';
import { createSession, verifyPassword } from '@/lib/auth';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/** POST /api/admin/auth/login — autenticação real com sessão em banco. */
export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`login:${ip}`, 8, 10 * 60_000);
    if (!rl.ok) return fail(`Muitas tentativas. Aguarde ${Math.ceil(rl.retryAfterSec / 60)} minuto(s).`, 429);

    const parsed = await parseBody(req, loginSchema);
    if ('error' in parsed) return parsed.error;
    const { email, password } = parsed.data;

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    // Mensagem genérica: não revela se o e-mail existe
    if (!user || !user.active) {
      await audit({ action: 'LOGIN_FAIL', entity: 'User', details: { email, reason: 'inexistente/inativo' } });
      return fail('E-mail ou senha incorretos.', 401);
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await audit({ action: 'LOGIN_FAIL', entity: 'User', entityId: user.id, details: { email, reason: 'senha' } });
      return fail('E-mail ou senha incorretos.', 401);
    }

    await createSession(user.id, req.headers.get('user-agent') ?? undefined, ip);
    await audit({ user: { id: user.id, name: user.name, email: user.email, role: user.role as 'ADMIN' | 'OPERADOR' }, action: 'LOGIN', entity: 'User', entityId: user.id });

    return ok({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    return handleError(e);
  }
}
