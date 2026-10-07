'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { useCallback } from 'react';
import { CalendarCheck, MessageCircle, Home, Zap, ClipboardCheck, ArrowDown, CreditCard } from 'lucide-react';
import { WaButton } from './wa-button';
import { VoicePlayer } from './audio-player';

const TRUST_ITEMS = [
  { icon: Home, label: 'Atendimento a domicílio' },
  { icon: Zap, label: 'Orçamento direto no WhatsApp' },
  { icon: ClipboardCheck, label: 'Avaliação antes de tudo' },
  { icon: CreditCard, label: 'Pagamento facilitado' },
];

/**
 * Hero em tela cheia: gradiente navy profundo, H1 em escala grande,
 * prova de confiança, mensagem de voz e foto em destaque com card flutuante.
 */
export function Hero({
  data,
  scrollTarget = '#servicos',
}: {
  data: {
    badge: string;
    title1: string;
    title2: string;
    subtitle: string;
    image: string;
    imageAlt: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  scrollTarget?: string;
}) {
  const reduced = useReducedMotion();

  // Luz que acompanha o cursor: atualiza CSS vars com rAF (só ponteiro fino)
  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse') return;
    const el = e.currentTarget;
    if (el.dataset.raf === '1') {
      el.dataset.mx = String(e.clientX);
      el.dataset.my = String(e.clientY);
      return;
    }
    el.dataset.raf = '1';
    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${((Number(el.dataset.mx || e.clientX) - rect.left) / rect.width) * 100}%`);
      el.style.setProperty('--my', `${((Number(el.dataset.my || e.clientY) - rect.top) / rect.height) * 100}%`);
      el.dataset.raf = '0';
    });
  }, []);

  return (
    <section
      onPointerMove={onPointerMove}
      className="cursor-glow relative overflow-hidden bg-hero-navy text-white"
      aria-label="Apresentação"
    >
      <div className="relative z-10 mx-auto grid min-h-[92svh] max-w-[1200px] w-full items-center gap-12 px-4 pb-20 pt-[104px] sm:px-6 sm:pb-24 sm:pt-[128px] lg:grid-cols-[1.04fr_0.96fr] lg:gap-8 lg:pb-28">
        {/* ---------- coluna de texto ---------- */}
        <div>
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-[13px] font-semibold tracking-wide text-aqua-100"
          >
            <span aria-hidden="true" className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aqua-300 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-aqua-300" />
            </span>
            {data.badge}
          </motion.p>

          <motion.h1
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="font-display mt-6 text-balance text-[2.375rem] font-extrabold leading-[1.05] sm:text-6xl lg:text-[4rem] xl:text-[4.25rem]"
          >
            {data.title1}
            <span className="text-gradient-frost mt-1 block">{data.title2}</span>
          </motion.h1>

          <motion.p
            initial={reduced ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="mt-6 max-w-xl text-pretty text-[17px] leading-relaxed text-blue-100/90 sm:text-lg"
          >
            {data.subtitle}
          </motion.p>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="mt-9 flex flex-col gap-3.5 sm:flex-row sm:items-center"
          >
            <WaButton
              href={`https://wa.me/5562991579369?text=${encodeURIComponent('Olá! Vi o site da JC Lavagem a Seco e gostaria de um orçamento.')}`}
              eventType="WHATSAPP_CLICK"
              eventMeta="hero"
              className="min-h-[56px] whitespace-nowrap px-8 text-base"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              {data.ctaPrimary}
            </WaButton>
            <motion.a
              href="#agendamento"
              whileTap={reduced ? undefined : { scale: 0.97 }}
              whileHover={reduced ? undefined : { y: -2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className="inline-flex min-h-[56px] items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-white/20 bg-white/[0.06] px-8 text-base font-bold text-white backdrop-blur-sm transition-colors duration-200 hover:border-white/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <CalendarCheck className="h-5 w-5" aria-hidden="true" />
              {data.ctaSecondary}
            </motion.a>
          </motion.div>

          {/* prova de confiança */}
          <motion.ul
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.34 }}
            className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3"
            aria-label="Diferenciais do atendimento"
          >
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-[13.5px] font-semibold text-blue-100/85">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.09] text-aqua-300" aria-hidden="true">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {label}
              </li>
            ))}
          </motion.ul>

          {/* mensagem de voz */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.42 }}
            className="mt-7"
          >
            <VoicePlayer src="/audio/mensagem-jc.m4a" />
          </motion.div>
        </div>

        {/* ---------- coluna da foto ---------- */}
        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.15 }}
          className="relative mx-auto w-full max-w-[520px] lg:max-w-none"
        >
          {/* moldura deslocada */}
          <div aria-hidden="true" className="absolute -left-3 -top-3 h-full w-full rounded-[30px] border-2 border-aqua-300/20 sm:-left-5 sm:-top-5" />
          <div aria-hidden="true" className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-aqua-300/15 blur-[70px]" />

          <div className="relative overflow-hidden rounded-[30px] shadow-deep ring-1 ring-white/15">
            <Image
              src={data.image}
              alt={data.imageAlt}
              width={928}
              height={1152}
              priority
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 520px, 560px"
              className="h-[400px] w-full object-cover object-top sm:h-[500px] lg:h-[560px]"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-deep-800/70 via-transparent to-deep/20" />

            {/* card flutuante: selo de avaliação */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3.5 rounded-3xl glass-dark p-4 ring-1 ring-white/15 sm:bottom-5 sm:left-5 sm:right-auto">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-aqua-300/20 text-aqua-200" aria-hidden="true">
                <ClipboardCheck className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-bold text-white">Avaliação antes de tudo</p>
                <p className="mt-0.5 text-[12.5px] leading-snug text-blue-100/80">
                  Cada tecido é avaliado antes de começar.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* indicador de rolagem */}
      <motion.a
        href={scrollTarget}
        aria-label="Rolar para serviços"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-1.5 text-blue-100/50 transition-colors hover:text-white lg:flex"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">Explore</span>
        <motion.span animate={reduced ? undefined : { y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}>
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
        </motion.span>
      </motion.a>
    </section>
  );
}
