'use client';

/**
 * CTA fixo no celular: aparece após rolar a hero e se esconde quando o
 * formulário de agendamento está visível (não sobrepõe conteúdo).
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { trackEvent } from './analytics';

export function MobileCta({ whatsappIntl, ctaBar }: { whatsappIntl: string; ctaBar: { text: string; button: string } }) {
  const [visible, setVisible] = useState(false);
  const [nearForm, setNearForm] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 520);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const form = document.getElementById('agendamento');
    if (!form || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      (entries) => setNearForm(entries[0]?.isIntersecting ?? false),
      { threshold: 0.08 },
    );
    io.observe(form);
    return () => io.disconnect();
  }, []);

  const show = visible && !nearForm;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={reduced ? { y: 0, opacity: 0 } : { y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:hidden"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <div className="glass-dark flex items-center justify-between gap-3 rounded-full border border-white/12 py-2.5 pl-5 pr-2.5 shadow-deep">
            <p className="text-[13.5px] font-bold leading-tight text-white">{ctaBar.text}</p>
            <a
              href={`https://wa.me/${whatsappIntl}?text=${encodeURIComponent('Olá! Vi o site da JC Lavagem a Seco e gostaria de um orçamento.')}`}
              onClick={() => trackEvent('WHATSAPP_CLICK', 'cta-fixo-mobile')}
              className="inline-flex min-h-[48px] shrink-0 items-center gap-2 rounded-full bg-action px-5 text-[14px] font-bold text-white shadow-cta"
            >
              <MessageCircle className="h-[18px] w-[18px]" aria-hidden="true" />
              {ctaBar.button}
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
