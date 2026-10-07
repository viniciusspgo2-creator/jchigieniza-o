/**
 * Resume os nomes das formas de pagamento para exibição pública.
 * Regra pedida: em vez de listar "Cartão de débito" e "Cartão de crédito"
 * separadamente, mostra um único selo "Aceitamos Cartões".
 * Outras formas (Pix, Dinheiro etc.) continuam aparecendo normalmente.
 */
export function summarizePaymentNames(names: string[]): string[] {
  const out: string[] = [];
  let hasCard = false;
  for (const raw of names) {
    const name = raw?.trim();
    if (!name) continue;
    if (/cart/i.test(name)) {
      hasCard = true; // agrupa débito/crédito em um único selo
      continue;
    }
    if (!out.includes(name)) out.push(name);
  }
  if (hasCard) out.push('Aceitamos Cartões');
  return out;
}
