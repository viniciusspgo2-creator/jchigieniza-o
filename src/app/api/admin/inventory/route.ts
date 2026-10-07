import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, fail, parseBody, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { inventoryItemSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/** GET /api/admin/inventory?category=&q=&belowMin= */
export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const q = url.searchParams.get('q');
    const belowMin = url.searchParams.get('belowMin') === '1';

    const where: Record<string, unknown> = { archived: false };
    if (category && ['LIMPEZA', 'IMPERMEABILIZANTE', 'EPI', 'FERRAMENTA', 'OUTRO'].includes(category)) where.category = category;
    if (q) where.name = { contains: q };

    const items = await db.inventoryItem.findMany({
      where,
      include: { supplier: { select: { id: true, name: true } }, _count: { select: { movements: true } } },
      orderBy: { name: 'asc' },
      take: 300,
    });

    const filtered = belowMin ? items.filter((i) => i.quantity < i.minQuantity) : items;
    return ok({ items: filtered });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = await parseBody(req, inventoryItemSchema);
    if ('error' in parsed) return parsed.error;
    const data = parsed.data;

    const item = await db.inventoryItem.create({
      data: {
        name: data.name,
        category: data.category,
        unit: data.unit,
        displayUnit: data.displayUnit || null,
        minQuantity: data.minQuantity,
        costCents: data.costCents,
        purchaseUnitAmount: data.purchaseUnitAmount ?? null,
        supplierId: data.supplierId || null,
        expiryDate: data.expiryDate || null,
        quantity: 0, // saldo inicial zero; entradas via movimento com histórico
      },
    });
    await audit({ user, action: 'CREATE', entity: 'InventoryItem', entityId: item.id, details: { name: item.name } });
    return ok({ item }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
