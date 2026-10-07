import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  category: z.enum(['LIMPEZA', 'IMPERMEABILIZANTE', 'EPI', 'FERRAMENTA', 'OUTRO']).optional(),
  displayUnit: z.string().trim().max(10).optional().nullable(),
  minQuantity: z.coerce.number().int().min(0).optional(),
  costCents: z.coerce.number().int().min(0).optional(),
  purchaseUnitAmount: z.coerce.number().int().min(1).max(1_000_000).optional().nullable(),
  supplierId: z.string().max(40).optional().nullable(),
  expiryDate: z.string().max(10).optional().nullable(),
  archived: z.boolean().optional(),
});

/** PATCH /api/admin/inventory/[id] — edição de cadastro (não altera saldo; saldo muda por movimento). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const parsed = await parseBody(req, updateSchema);
    if ('error' in parsed) return parsed.error;
    const data = parsed.data;

    const item = await db.inventoryItem.update({
      where: { id },
      data: {
        ...data,
        expiryDate: data.expiryDate === '' ? null : data.expiryDate,
      },
    });
    await audit({ user, action: 'UPDATE', entity: 'InventoryItem', entityId: id, details: data });
    return ok({ item });
  } catch (e) {
    return handleError(e);
  }
}
