'use client';

/**
 * Botão/CTA com resposta visual tátil (framer-motion whileTap/whileHover)
 * e registro de evento de conversão no analytics first-party.
 * Altura mínima 52px + shadow vermelha de ação.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { trackEvent } from '@/components/site/analytics';
import { ReactNode } from 'react';

export function WaButton({
  href,
  children,
  eventType = 'WHATSAPP_CLICK',
  eventMeta,
  variant = 'primary',
  className,
  onClick,
}: {
  href: string;
  children: ReactNode;
  eventType?: 'WHATSAPP_CLICK' | 'PHONE_CLICK' | 'INSTAGRAM_CLICK' | 'CHAT_WHATSAPP';
  eventMeta?: string;
  variant?: 'primary' | 'outline' | 'light' | 'action';
  className?: string;
  onClick?: () => void;
}) {
  const reduced = useReducedMotion();

  const styles = {
    primary: 'bg-action text-white shadow-cta hover:bg-action-600 hover:shadow-cta-lg focus-visible:ring-action',
    action: 'bg-action text-white shadow-cta hover:bg-action-600 hover:shadow-cta-lg focus-visible:ring-action',
    outline: 'border-2 border-deep/12 bg-white text-deep hover:border-brand hover:text-brand hover:shadow-soft focus-visible:ring-brand',
    light: 'bg-white text-deep shadow-soft hover:bg-aqua-50 focus-visible:ring-white',
  }[variant];

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        trackEvent(eventType, eventMeta);
        onClick?.();
      }}
      whileTap={reduced ? undefined : { scale: 0.97 }}
      whileHover={reduced ? undefined : { y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={`inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full px-7 text-[15px] font-bold outline-none ring-offset-2 transition-all duration-200 focus-visible:ring-2 ${styles} ${className ?? ''}`}
    >
      {children}
    </motion.a>
  );
}
