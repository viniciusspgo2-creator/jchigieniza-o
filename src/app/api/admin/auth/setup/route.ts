import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { setupSchema } from '@/lib/validation';
import { createSession, hashPassword } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/auth/setup — cria o PRIMEIRO administrador.
 * Segurança: só funciona quando não há nenhum usuário ativo no banco
 * E o token de configuração (ADMIN_SETUP_TOKEN do .env) é válido.
 * Sem senha padrão em código: a credencial é escolhida aqui, uma única vez.
 */
export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(`setup:${clientIp(req)}`, 5, 15 * 60_000);
    if (!rl.ok) return fail('Muitas tentativas. Aguarde alguns minutos.', 429);

    const parsed = await parseBody(req, setupSchema);
    if ('error' in parsed) return parsed.error;
    const { setupToken, name, email, password } = parsed.data;

    const expected = process.env.ADMIN_SETUP_TOKEN;
    if (!expected) return fail('Configuração desabilitada: defina ADMIN_SETUP_TOKEN no arquivo .env do servidor.', 403);
    if (setupToken !== expected) return fail('Token de configuração inválido.', 403);

    const userCount = await db.user.count();
    if (userCount > 0) return fail('O painel já possui administradores. Use a tela de login.', 409);

    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash: await hashPassword(password),
        role: 'ADMIN',
      },
    });

    await createSession(user.id, req.headers.get('user-agent') ?? undefined, clientIp(req));
    await audit({ user: { id: user.id, name: user.name, email: user.email, role: 'ADMIN' }, action: 'SETUP_ADMIN', entity: 'User', entityId: user.id });

    return ok({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

/** GET — informa se o setup está disponível (sem usuários) e se o token está configurado. */
export async function GET() {
  const userCount = await db.user.count();
  return ok({
    available: userCount === 0,
    tokenConfigured: Boolean(process.env.ADMIN_SETUP_TOKEN),
  });
}
