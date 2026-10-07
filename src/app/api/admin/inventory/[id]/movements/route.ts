import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { inventoryMovementSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';
import { notify } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/inventory/[id]/movements — registra entrada/saída/consumo/ajuste.
 * Regras:
 * - Impece saldo negativo (verificação dentro da transação).
 * - Toda movimentação grava histórico (tipo, quantidade, delta, saldo resultante, motivo).
 * - Estorno é feito como novo movimento de ajuste (nunca apaga histórico).
 * - Consumo vinculado a atendimento (bookingId) não é duplicável: mesmo booking+item+tipo CONSUMO bloqueado.
 * - Cancelamento de atendimento NÃO desconta automaticamente insumos.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const parsed = await parseBody(req, inventoryMovementSchema);
    if ('error' in parsed) return parsed.error;
    const data = parsed.data;

    const item = await db.inventoryItem.findUnique({ where: { id } });
    if (!item) return fail('Item não encontrado.', 404);
    if (item.archived) return fail('Item arquivado não recebe movimentos.', 409);

    let delta = data.quantity;
    if (data.type === 'SAIDA' || data.type === 'CONSUMO') delta = -data.quantity;
    if (data.type === 'AJUSTE' && data.signed === '-') delta = -data.quantity;

    if (data.type === 'CONSUMO' && data.bookingId) {
      const dup = await db.inventoryMovement.findFirst({
        where: { itemId: id, bookingId: data.bookingId, type: 'CONSUMO' },
      });
      if (dup) return fail('Já existe baixa de consumo desse item para esse atendimento (evita duplicidade).', 409);
    }

    const result = await db.$transaction(async (tx) => {
      const fresh = await tx.inventoryItem.findUnique({ where: { id } });
      if (!fresh) throw new Error('NOT_FOUND');
      const balance = fresh.quantity + delta;
      if (balance < 0) throw new InsufficientError(`Saldo insuficiente: ${fresh.quantity} ${fresh.unit} em estoque. Operação impediria saldo negativo.`);
      const movement = await tx.inventoryMovement.create({
        data: {
          itemId: id,
          type: data.type,
          quantity: data.quantity,
          delta,
          balanceAfter: balance,
          reason: data.reason || null,
          bookingId: data.bookingId || null,
          userId: user.id,
        },
      });
      await tx.inventoryItem.update({ where: { id }, data: { quantity: balance } });
      return { movement, balance };
    }).catch((e) => {
      if (e instanceof InsufficientError) throw e;
      if (e.message === 'NOT_FOUND') throw new NotFoundError('Item não encontrado.');
      throw e;
    });

    await audit({ user, action: 'STOCK_MOVE', entity: 'InventoryItem', entityId: id, details: { type: data.type, quantity: data.quantity, delta, balanceAfter: result.balance } });

    // Alerta de estoque mínimo
    if (result.balance < item.minQuantity) {
      await notify({
        type: 'ESTOQUE',
        title: 'Estoque abaixo do mínimo',
        message: `${item.name}: ${result.balance} ${item.unit} (mínimo ${item.minQuantity}).`,
        link: '/admin/estoque',
      });
    }

    return ok({ movement: result.movement, balance: result.balance }, { status: 201 });
  } catch (e) {
    if (e instanceof InsufficientError) return fail(e.message, 409);
    if (e instanceof NotFoundError) return fail(e.message, 404);
    return handleError(e);
  }
}

/** GET /api/admin/inventory/[id]/movements — histórico. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    const movements = await db.inventoryMovement.findMany({
      where: { itemId: id },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return ok({ movements });
  } catch (e) {
    return handleError(e);
  }
}

class InsufficientError extends Error {}
class NotFoundError extends Error {}
