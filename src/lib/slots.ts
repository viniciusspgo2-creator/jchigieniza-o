import 'server-only';
import { db } from './db';
import { buildSlots } from './tz';
import { todaySP, nowInSP } from './tz';
import type { BusinessHours } from '@prisma/client';

/** Regras de agenda por dia da semana (mapa). */
export async function getHoursMap(): Promise<Map<number, BusinessHours>> {
  const rows = await db.businessHours.findMany();
  return new Map(rows.map((r) => [r.weekday, r]));
}

/** Bloqueios (folgas) de um dia. */
export async function getBlockings(date: string) {
  return db.dayBlocking.findMany({ where: { date } });
}

/** Lista de janelas disponíveis para uma data (YYYY-MM-DD), com ocupação. */
export async function availableSlots(date: string): Promise<{ slot: string; available: boolean }[]> {
  const [y, m, d] = date.split('-').map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const rule = (await getHoursMap()).get(weekday);
  if (!rule || !rule.active || !rule.openTime || !rule.closeTime) return [];

  const slots = buildSlots(rule.openTime, rule.closeTime, rule.slotMinutes, rule.breakStart, rule.breakEnd);
  const blockings = await getBlockings(date);
  const dayBlocked = blockings.some((b) => !b.timeSlot);
  const blockedSlots = new Set(blockings.map((b) => b.timeSlot).filter(Boolean) as string[]);

  // Ocupação: agendamentos confirmados/em atendimento por data+janela
  const bookings = await db.booking.findMany({
    where: { preferredDate: date, status: { in: ['CONFIRMADO', 'EM_ATENDIMENTO'] } },
    select: { timeSlot: true },
  });
  const occupied = new Map<string, number>();
  for (const b of bookings) occupied.set(b.timeSlot, (occupied.get(b.timeSlot) ?? 0) + 1);

  const today = todaySP();
  const now = nowInSP();
  const isToday = date === today;

  return slots.map((slot) => {
    if (dayBlocked || blockedSlots.has(slot)) return { slot, available: false };
    if ((occupied.get(slot) ?? 0) >= rule.capacityPerSlot) return { slot, available: false };
    // janela já começou hoje: indisponível
    if (isToday) {
      const [hh, mm] = slot.split(':').map(Number);
      if (hh < now.hh || (hh === now.hh && mm <= now.mm)) return { slot, available: false };
    }
    return { slot, available: true };
  });
}

/** Valida se uma data+janela é agendável (para o servidor confiar só nele mesmo). */
export async function isSlotValid(date: string, slot: string): Promise<boolean> {
  const all = await availableSlots(date);
  const found = all.find((s) => s.slot === slot);
  return Boolean(found?.available);
}

/** Aceita janela livre por período quando não há janelas fixas (fallback do formulário). */
export function isPeriodValid(period?: string | null): boolean {
  return period === 'MANHA' || period === 'TARDE' || period === 'NOITE';
}
