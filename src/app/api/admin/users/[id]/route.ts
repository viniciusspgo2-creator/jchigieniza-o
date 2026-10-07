import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  name: z.string().trim().min(3).max(120).optional(),
  role: z.enum(['ADMIN', 'OPERADOR']).optional(),
  active: z.boolean().optional(),
  resetPassword: z.boolean().optional(),
});

/** PATCH /api/admin/users/[id] — apenas ADMIN. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const parsed = await parseBody(req, patchSchema);
    if ('error' in parsed) return parsed.error;
    const data = parsed.data;

    const target = await db.user.findUnique({ where: { id } });
    if (!target) return fail('Usuário não encontrado.', 404);

    if (data.resetPassword) {
      const token = createHash('sha256').update(crypto.randomUUID() + Date.now()).digest('hex').slice(0, 43);
      await db.passwordResetToken.create({
        data: {
          tokenHash: createHash('sha256').update(token).digest('hex'),
          userId: id,
          expiresAt: new Date(Date.now() + 60 * 60_000),
          requestedBy: admin.id,
        },
      });
      await audit({ user: admin, action: 'PASSWORD_RESET_REQUEST', entity: 'User', entityId: id });
      return ok({
        resetRequested: true,
        // Link de uso único, exibido apenas nesta resposta (token bruto nunca é persistido).
        resetUrl: '/admin/recuperar?token=' + token,
        message: 'Link de redefinição gerado (válido por 1h). Copie e repasse ao usuário por canal seguro — ele não será exibido novamente.',
      });
    }

    // Proteção do último admin ativo
    if (target.role === 'ADMIN' && ((data.role && data.role !== 'ADMIN') || data.active === false)) {
      if (id === admin.id) return fail('Não é possível rebaixar/desativar a própria conta de admin.', 409);
      const activeAdmins = await db.user.count({ where: { role: 'ADMIN', active: true, id: { not: id } } });
      if (activeAdmins === 0) return fail('É necessário manter ao menos um administrador ativo.', 409);
    }

    const user = await db.user.update({ where: { id }, data: { name: data.name, role: data.role, active: data.active } });
    if (data.active === false) await db.session.deleteMany({ where: { userId: id } });
    await audit({ user: admin, action: 'UPDATE', entity: 'User', entityId: id, details: data });
    return ok({ user: { id: user.id, name: user.name, email: user.email, role: user.role, active: user.active } });
  } catch (e) {
    return handleError(e);
  }
}
