'use client';

import { MessageCircle, Phone } from 'lucide-react';
import { Reveal } from './reveal';
import { trackEvent } from './analytics';

/**
 * Faixa de CTA final antes do rodapé: navy com brilho, título grande e
 * botão do WhatsApp em vermelho.
 */
export function CtaBand({
  text,
  button,
  phoneDisplay,
  whatsappIntl,
}: {
  text: string;
  button: string;
  phoneDisplay: string;
  whatsappIntl: string;
}) {
  const waLink = `https://wa.me/${whatsappIntl}?text=${encodeURIComponent('Olá! Vi o site da JC Lavagem a Seco e gostaria de um orçamento.')}`;

  return (
    <section className="bg-white pb-20 pt-4 sm:pb-24 lg:pb-32" aria-labelledby="cta-final-titulo">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] bg-band-navy px-6 py-16 text-center text-white shadow-deep sm:px-12 sm:py-20 lg:py-24">
            {/* brilhos decorativos */}
            <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand/35 blur-[110px]" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-aqua-300/15 blur-[120px]" />
            <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-aqua-300/40 to-transparent" />

            <div className="relative mx-auto max-w-2xl">
              <h2 id="cta-final-titulo" className="font-display text-balance text-[2.1rem] font-extrabold leading-[1.1] sm:text-[2.9rem]">
                Pronto para renovar seu estofado?
              </h2>
              <p className="mt-5 text-pretty text-[17px] leading-relaxed text-blue-100/85">{text}</p>

              <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('WHATSAPP_CLICK', 'cta-final')}
                  className="inline-flex min-h-[60px] items-center justify-center gap-2.5 rounded-full bg-action px-9 text-lg font-bold text-white shadow-cta-lg transition-all duration-200 hover:scale-[1.02] hover:bg-action-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <MessageCircle className="h-[22px] w-[22px]" aria-hidden="true" />
                  {button}
                </a>
                <a
                  href={`tel:+${whatsappIntl}`}
                  className="inline-flex min-h-[60px] items-center justify-center gap-2 rounded-full border-2 border-white/20 bg-white/[0.06] px-8 text-lg font-bold text-white backdrop-blur-sm transition-colors duration-200 hover:border-white/40 hover:bg-white/10"
                >
                  <Phone className="h-5 w-5" aria-hidden="true" />
                  {phoneDisplay}
                </a>
              </div>

              <p className="mt-6 text-[13.5px] font-medium text-blue-100/60">
                Atendimento a domicílio em Goiânia e região · Seg a sáb, 8h às 18h
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
