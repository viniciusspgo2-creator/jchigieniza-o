'use client';

/**
 * Botão flutuante do WhatsApp: presente em todas as páginas, canto
 * inferior direito, com pulso sutil (respeita prefers-reduced-motion).
 * No mobile fica acima da barra de CTA fixa.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { trackEvent } from './analytics';

export function WaFloat({ whatsappIntl }: { whatsappIntl: string }) {
  const reduced = useReducedMotion();
  const href = `https://wa.me/${whatsappIntl}?text=${encodeURIComponent('Olá! Vi o site da JC Lavagem a Seco e gostaria de um orçamento.')}`;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent('WHATSAPP_CLICK', 'float')}
      aria-label="Pedir orçamento pelo WhatsApp"
      whileHover={reduced ? undefined : { scale: 1.06 }}
      whileTap={reduced ? undefined : { scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className="wa-pulse float-action fixed bottom-[5.75rem] right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-action text-white shadow-cta-lg sm:bottom-6 sm:h-[60px] sm:w-[60px]"
    >
      <MessageCircle className="h-7 w-7" aria-hidden="true" />
    </motion.a>
  );
}
