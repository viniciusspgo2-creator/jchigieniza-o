import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { hashPassword } from '@/lib/auth';
import { audit, notify } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  email: z.string().trim().email().max(160),
});

const confirmSchema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(10).max(200).regex(/[A-Za-zçÇ]/, 'A senha deve conter letras.').regex(/[0-9]/, 'A senha deve conter números.'),
});

/**
 * POST /api/admin/auth/recuperar — solicita recuperação de acesso.
 * Sem serviço de e-mail configurado (pendente), o token é entregue de forma
 * segura: um administrador vê a solicitação no painel e repassa o token por
 * canal confiável. O token é hash no banco, expira em 1h e é de uso único.
 */
export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(`recuperar:${clientIp(req)}`, 5, 15 * 60_000);
    if (!rl.ok) return fail('Muitas solicitações. Aguarde alguns minutos.', 429);

    const parsed = await parseBody(req, requestSchema);
    if ('error' in parsed) return parsed.error;
    const { email } = parsed.data;

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user && user.active) {
      const token = createHash('sha256').update(crypto.randomUUID() + Date.now()).digest('hex').slice(0, 43);
      await db.passwordResetToken.create({
        data: {
          tokenHash: createHash('sha256').update(token).digest('hex'),
          userId: user.id,
          expiresAt: new Date(Date.now() + 60 * 60_000),
        },
      });
      await notify({
        type: 'SISTEMA',
        title: 'Solicitação de recuperação de acesso',
        message: `O usuário ${user.email} solicitou recuperação de senha. Token (válido 1h): ${token}`,
        link: '/admin/configuracoes',
      });
      await audit({ action: 'PASSWORD_RESET_REQUEST', entity: 'User', entityId: user.id });
    }
    // Resposta genérica: não revela existência do e-mail
    return ok({
      message: 'Se o e-mail estiver cadastrado, um administrador receberá a solicitação e enviará o token de recuperação pelo canal de contato da empresa.',
    });
  } catch (e) {
    return handleError(e);
  }
}

/** PUT /api/admin/auth/recuperar — define nova senha usando o token. */
export async function PUT(req: NextRequest) {
  try {
    const rl = rateLimit(`reset:${clientIp(req)}`, 8, 15 * 60_000);
    if (!rl.ok) return fail('Muitas tentativas. Aguarde alguns minutos.', 429);

    const parsed = await parseBody(req, confirmSchema);
    if ('error' in parsed) return parsed.error;
    const { token, password } = parsed.data;

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const rec = await db.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!rec || rec.usedAt || rec.expiresAt < new Date()) {
      return fail('Token inválido ou expirado. Solicite um novo.', 403);
    }
    await db.user.update({ where: { id: rec.userId }, data: { passwordHash: await hashPassword(password) } });
    await db.passwordResetToken.update({ where: { id: rec.id }, data: { usedAt: new Date() } });
    // Invalida sessões existentes do usuário por segurança
    await db.session.deleteMany({ where: { userId: rec.userId } });
    await audit({ action: 'PASSWORD_RESET_DONE', entity: 'User', entityId: rec.userId });
    return ok({ message: 'Senha redefinida com sucesso. Faça login com a nova senha.' });
  } catch (e) {
    return handleError(e);
  }
}
