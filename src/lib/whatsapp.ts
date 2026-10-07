/** Link do WhatsApp com mensagem personalizada. */
export function waLink(whatsappIntl: string, message: string): string {
  return `https://wa.me/${whatsappIntl}?text=${encodeURIComponent(message)}`;
}

export function waMessageService(serviceName: string): string {
  return `Olá! Vi o site da JC Lavagem a Seco e gostaria de um orçamento para *${serviceName}*.`;
}

export function waMessageDefault(): string {
  return 'Olá! Vi o site da JC Lavagem a Seco e gostaria de um orçamento.';
}

export function waMessageBooking(protocol: string): string {
  return `Olá! Enviei a solicitação de agendamento ${protocol} pelo site e gostaria de continuar a conversa.`;
}

/** Formata telefone para exibição (62) 99999-9999. */
export function formatPhoneBR(intl: string): string {
  const d = intl.replace(/\D/g, '');
  const local = d.startsWith('55') ? d.slice(2) : d;
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  return `(${local.slice(0, 2)}) ${local.slice(2)}`;
}
