import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireUser, hashPassword, verifyPassword } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const schema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual.'),
  newPassword: z.string().min(10, 'A nova senha deve ter ao menos 10 caracteres.').max(200)
    .regex(/[A-Za-zçÇ]/, 'A nova senha deve conter letras.')
    .regex(/[0-9]/, 'A nova senha deve conter números.'),
});

/** POST /api/admin/auth/change-password — altera a própria senha. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = await parseBody(req, schema);
    if ('error' in parsed) return parsed.error;
    const { currentPassword, newPassword } = parsed.data;

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return fail('Usuário não encontrado.', 404);
    const valid = await verifyPassword(currentPassword, dbUser.passwordHash);
    if (!valid) return fail('Senha atual incorreta.', 403);

    await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } });
    await audit({ user, action: 'CHANGE_PASSWORD', entity: 'User', entityId: user.id });
    return ok({ message: 'Senha alterada com sucesso.' });
  } catch (e) {
    return handleError(e);
  }
}
