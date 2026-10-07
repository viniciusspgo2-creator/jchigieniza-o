/**
 * Utilitários de fuso America/Sao_Paulo.
 * Desde 2019 o Brasil não observa horário de verão; offset fixo -03:00,
 * mas usamos Intl para derivar o offset correto de forma robusta.
 */

export const TZ = 'America/Sao_Paulo';

/** Data/hora atual em SP, como partes locais. */
export function nowInSP(): { y: number; m: number; d: number; hh: number; mm: number; weekday: number } {
  const fmt = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short',
  });
  const parts = fmt.formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const year = Number(get('year'));
  const month = Number(get('month'));
  const day = Number(get('day'));
  const hour = Number(get('hour')) % 24;
  const minute = Number(get('minute'));
  // weekday: converter para 0=domingo
  const wdLabel = get('weekday').toLowerCase();
  const map: Record<string, number> = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sáb: 6, sab: 6 };
  const weekday = map[wdLabel.slice(0, 3)] ?? new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return { y: year, m: month, d: day, hh: hour, mm: minute, weekday };
}

/** Hoje em SP como YYYY-MM-DD. */
export function todaySP(): string {
  const { y, m, d } = nowInSP();
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Converte wall time de SP (YYYY-MM-DD + HH:MM) para Date UTC. */
export function spWallTimeToUTC(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  // Descobre offset de SP nessa data (minutos a oeste de UTC)
  const ts = Date.UTC(y, m - 1, d, hh, mm);
  const offset = tzOffsetMinutes(y, m, d, hh, mm);
  return new Date(ts - offset * 60_000);
}

function tzOffsetMinutes(y: number, m: number, d: number, hh: number, mm: number): number {
  // Algoritmo: compara a data UTC com a mesma data formatada em SP
  const asUTC = Date.UTC(y, m - 1, d, hh, mm);
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const parts = fmt.formatToParts(new Date(asUTC));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? '0');
  const asTZ = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'));
  return Math.round((asTZ - asUTC) / 60_000);
}

/** Lista de janelas de horário (slots) para um dia, a partir das regras de atendimento. */
export function buildSlots(open: string, close: string, slotMinutes: number, breakStart?: string | null, breakEnd?: string | null): string[] {
  const toMin = (t: string) => Number(t.split(':')[0]) * 60 + Number(t.split(':')[1]);
  const out: string[] = [];
  const start = toMin(open);
  const end = toMin(close);
  const bs = breakStart ? toMin(breakStart) : null;
  const be = breakEnd ? toMin(breakEnd) : null;
  for (let t = start; t + slotMinutes <= end; t += slotMinutes) {
    const slotStart = t;
    const slotEnd = t + slotMinutes;
    // pula slot totalmente dentro do intervalo de pausa
    if (bs !== null && be !== null && slotStart >= bs && slotEnd <= be) continue;
    const hh = String(Math.floor(slotStart / 60)).padStart(2, '0');
    const mm = String(slotStart % 60).padStart(2, '0');
    out.push(`${hh}:${mm}`);
  }
  return out;
}

export function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function isValidDateStr(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}
