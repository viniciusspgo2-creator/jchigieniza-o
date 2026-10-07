/** Formatação de valores em centavos (sem ponto flutuante). */

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** "R$ 1.234,56" -> 123456 */
export function parseBRLToCents(input: string): number | null {
  if (!input) return null;
  let s = input.replace(/[R$\s.]/g, '').replace(',', '.').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const v = Math.round(parseFloat(s) * 100);
  return Number.isFinite(v) ? v : null;
}

/** Converte quantidade em unidade base p/ exibição coerente (ml->L, g->kg). */
export function formatQty(quantity: number, unit: string): string {
  if (unit === 'ml' && quantity >= 1000) {
    const l = quantity / 1000;
    return `${l % 1 === 0 ? l : l.toFixed(2)} L`;
  }
  if (unit === 'g' && quantity >= 1000) {
    const kg = quantity / 1000;
    return `${kg % 1 === 0 ? kg : kg.toFixed(2)} kg`;
  }
  return `${quantity} ${unit}`;
}

export function unitLabel(unit: string): string {
  return { ml: 'mililitro (ml)', g: 'grama (g)', un: 'unidade (un)' }[unit] ?? unit;
}

/** Unidade de compra possível p/ base (ex.: ml -> L). */
export function purchaseUnit(unit: string): { unit: string; factor: number } {
  if (unit === 'ml') return { unit: 'L', factor: 1000 };
  if (unit === 'g') return { unit: 'kg', factor: 1000 };
  return { unit: 'un', factor: 1 };
}
