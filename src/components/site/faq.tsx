'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MessageCircle, Plus } from 'lucide-react';
import { Reveal } from './reveal';

type Faq = { id: string; question: string; answer: string };

/**
 * Accordion acessível: botão com aria-expanded + região com aria-labelledby,
 * ícone +/− animado e destaque sutil na pergunta aberta.
 */
export function FaqSection({
  intro,
  faqs,
  whatsappIntl,
}: {
  intro: { title: string; text: string };
  faqs: Faq[];
  whatsappIntl: string;
}) {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);
  const reduced = useReducedMotion();

  return (
    <section id="duvidas" className="scroll-mt-24 bg-white py-20 sm:py-24 lg:py-32" aria-labelledby="duvidas-titulo">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-action">Dúvidas frequentes</p>
              <h2
                id="duvidas-titulo"
                className="font-display mt-3 text-balance text-[2rem] font-extrabold leading-[1.12] text-deep sm:text-[2.6rem]"
              >
                {intro.title}
              </h2>
              <p className="mt-5 max-w-md text-pretty text-[17px] leading-relaxed text-ink-soft">{intro.text}</p>

              <a
                href={`https://wa.me/${whatsappIntl}?text=${encodeURIComponent('Olá! Tenho uma dúvida que não encontrei no site.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex min-h-[52px] items-center gap-2 rounded-full border-2 border-deep/10 bg-ice px-6 text-[15px] font-bold text-deep transition-all duration-200 hover:border-brand hover:text-brand"
              >
                <MessageCircle className="h-4.5 w-4.5" aria-hidden="true" />
                Minha dúvida não está aqui
              </a>
            </Reveal>
          </div>

          <Reveal delay={0.08}>
            <div className="flex flex-col gap-3.5">
              {faqs.map((f, i) => {
                const open = openId === f.id;
                return (
                  <div
                    key={f.id}
                    className={`overflow-hidden rounded-[22px] border-2 transition-all duration-300 ${
                      open ? 'border-aqua-200 bg-aqua-50/50 shadow-soft' : 'border-border bg-white hover:border-aqua-100'
                    }`}
                  >
                    <h3>
                      <button
                        type="button"
                        id={`faq-btn-${f.id}`}
                        aria-expanded={open}
                        aria-controls={`faq-panel-${f.id}`}
                        onClick={() => setOpenId(open ? null : f.id)}
                        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                      >
                        <span className="flex items-start gap-3.5">
                          <span className="font-mono pt-0.5 text-xs font-bold text-aqua-400" aria-hidden="true">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className={`text-[15.5px] font-bold leading-snug transition-colors sm:text-base ${open ? 'text-deep' : 'text-ink'}`}>
                            {f.question}
                          </span>
                        </span>
                        <span
                          aria-hidden="true"
                          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                            open ? 'rotate-45 bg-deep text-aqua-200' : 'bg-ice text-ink-soft'
                          }`}
                        >
                          <Plus className="h-4.5 w-4.5" />
                        </span>
                      </button>
                    </h3>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          id={`faq-panel-${f.id}`}
                          role="region"
                          aria-labelledby={`faq-btn-${f.id}`}
                          initial={reduced ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={reduced ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="px-6 pb-6 pl-[3.4rem] text-[14.5px] leading-relaxed text-ink-soft">{f.answer}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
