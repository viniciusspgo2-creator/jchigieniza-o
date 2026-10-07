'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Menu, X, MessageCircle, ArrowUpRight, Phone, Instagram, LockKeyhole } from 'lucide-react';
import { trackEvent } from './analytics';

const NAV_LABELS: Record<string, string> = {
  'servicos': 'Serviços',
  'resultados': 'Resultados',
  'como-funciona': 'Como funciona',
  'diferenciais': 'Diferenciais',
  'agendamento': 'Agendamento',
  'duvidas': 'Dúvidas',
  'blog': 'Blog',
  'contato': 'Contato',
};

export function Header({
  brand,
  ctaPrimary,
  whatsappIntl,
  visibleSections,
  phoneDisplay,
  instagramUrl,
  instagramHandle,
}: {
  brand: { name: string; tagline: string; logoLight: string; logoDark: string };
  ctaPrimary: string;
  whatsappIntl: string;
  visibleSections: string[];
  phoneDisplay?: string;
  instagramUrl?: string;
  instagramHandle?: string;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    document.body.classList.toggle('menu-open', open);
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('menu-open');
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const waLink = `https://wa.me/${whatsappIntl}?text=${encodeURIComponent('Olá! Vi o site da JC Lavagem a Seco e gostaria de um orçamento.')}`;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-light shadow-soft' : 'bg-transparent'
      }`}
    >
      <div className="relative z-50 mx-auto flex h-[76px] max-w-[1200px] items-center justify-between gap-4 px-4 sm:h-20 sm:px-6">
        <Link href="/" className="relative z-10 flex shrink-0 items-center" aria-label={`${brand.name} — página inicial`}>
          {/* logo branco sobre navy (hero/menu) · logo navy sobre o header de vidro */}
          <Image
            src={scrolled && !open ? brand.logoLight : brand.logoDark}
            alt={`Logotipo ${brand.name}`}
            width={200}
            height={77}
            className="h-10 w-auto sm:h-12"
            priority
          />
        </Link>

        {/* Navegação desktop */}
        <nav aria-label="Navegação principal" className="hidden items-center gap-0.5 lg:flex">
          {visibleSections.slice(0, 5).map((id) => (
            <a
              key={id}
              href={`/#${id}`}
              className="whitespace-nowrap rounded-full px-3.5 py-2 text-[15px] font-semibold text-ink-soft transition-colors duration-200 hover:bg-deep/[0.06] hover:text-deep"
            >
              {NAV_LABELS[id] ?? id}
            </a>
          ))}
          <Link
            href="/galeria"
            className="whitespace-nowrap rounded-full px-3.5 py-2 text-[15px] font-semibold text-ink-soft transition-colors duration-200 hover:bg-deep/[0.06] hover:text-deep"
          >
            Galeria
          </Link>
          <Link
            href="/blog"
            className="whitespace-nowrap rounded-full px-3.5 py-2 text-[15px] font-semibold text-ink-soft transition-colors duration-200 hover:bg-deep/[0.06] hover:text-deep"
          >
            Blog
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {/* Instagram — botão visível no menu do header */}
          {instagramUrl && (
            <motion.a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Seguir a JC Lavagem a Seco no Instagram"
              title="Seguir no Instagram"
              whileTap={reduced ? undefined : { scale: 0.94 }}
              className={`hidden h-11 w-11 items-center justify-center rounded-full ring-1 transition-all duration-200 sm:inline-flex lg:h-12 lg:w-12 ${
                scrolled
                  ? 'text-deep ring-deep/10 hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7] hover:text-white hover:ring-transparent'
                  : 'text-white ring-white/25 hover:bg-white/10 hover:text-aqua-200'
              }`}
            >
              <Instagram className="h-[19px] w-[19px]" aria-hidden="true" />
            </motion.a>
          )}

          <a
            href={`tel:+${whatsappIntl}`}
            className={`hidden min-h-[52px] items-center gap-2 whitespace-nowrap rounded-full px-4 text-[15px] font-bold transition-colors min-[1536px]:inline-flex ${
              scrolled ? 'text-deep hover:text-brand' : 'text-white hover:text-aqua-200'
            }`}
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            {phoneDisplay ?? '(62) 99157-9369'}
          </a>

          <motion.a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('WHATSAPP_CLICK', 'header')}
            whileTap={reduced ? undefined : { scale: 0.96 }}
            className="hidden min-h-[52px] items-center gap-2 whitespace-nowrap rounded-full bg-action px-6 text-[15px] font-bold text-white shadow-cta transition-all duration-200 hover:bg-action-600 hover:shadow-cta-lg sm:inline-flex"
          >
            <MessageCircle className="h-[18px] w-[18px]" aria-hidden="true" />
            <span className="lg:hidden">{ctaPrimary}</span>
            <span className="hidden lg:inline">Pedir orçamento</span>
          </motion.a>

          {/* Área administrativa — acesso rápido ao painel */}
          <Link
            href="/admin"
            aria-label="Área administrativa"
            title="Área administrativa"
            className={`hidden h-11 w-11 items-center justify-center rounded-full ring-1 transition-all duration-200 lg:inline-flex ${
              scrolled
                ? 'text-ink-soft/70 ring-deep/10 hover:bg-deep/[0.06] hover:text-deep'
                : 'text-white/75 ring-white/20 hover:bg-white/10 hover:text-white'
            }`}
          >
            <LockKeyhole className="h-[17px] w-[17px]" aria-hidden="true" />
          </Link>

          {/* Botão menu mobile */}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            className={`inline-flex h-12 w-12 items-center justify-center rounded-full transition-colors lg:hidden ${
              open ? 'bg-white/10 text-white' : scrolled ? 'bg-deep/[0.06] text-deep' : 'bg-white/10 text-white backdrop-blur-sm'
            }`}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Painel mobile full-screen */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="menu-mobile"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-40 flex flex-col bg-deep lg:hidden"
          >
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-24 h-72 w-72 rounded-full bg-brand/25 blur-[110px]" />
            <div aria-hidden="true" className="pointer-events-none absolute -left-16 bottom-10 h-64 w-64 rounded-full bg-aqua-300/10 blur-[100px]" />

            <div className="h-[76px] shrink-0" aria-hidden="true" />

            <nav aria-label="Navegação mobile" className="thin-scroll relative flex-1 overflow-y-auto px-6 pb-8 pt-4">
              <ul className="flex flex-col">
                {visibleSections.map((id, i) => (
                  <motion.li
                    key={id}
                    initial={reduced ? false : { opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 + 0.045 * i, duration: 0.28 }}
                    className="border-b border-white/[0.07]"
                  >
                    <a
                      href={`/#${id}`}
                      onClick={() => setOpen(false)}
                      className="group flex items-center justify-between py-4"
                    >
                      <span className="font-display text-[1.4rem] font-bold text-white transition-colors group-hover:text-aqua-200">
                        {NAV_LABELS[id] ?? id}
                      </span>
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-aqua-200 transition-all group-hover:border-aqua-300/50 group-hover:bg-white/5" aria-hidden="true">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </a>
                  </motion.li>
                ))}
                <motion.li
                  initial={reduced ? false : { opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 + 0.045 * visibleSections.length, duration: 0.28 }}
                  className="border-b border-white/[0.07]"
                >
                  <Link
                    href="/galeria"
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-between py-4"
                  >
                    <span className="font-display text-[1.4rem] font-bold text-white transition-colors group-hover:text-aqua-200">
                      Galeria
                    </span>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-aqua-200 transition-all group-hover:border-aqua-300/50 group-hover:bg-white/5" aria-hidden="true">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </Link>
                </motion.li>
                <motion.li
                  initial={reduced ? false : { opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 + 0.045 * (visibleSections.length + 1), duration: 0.28 }}
                  className="border-b border-white/[0.07]"
                >
                  <Link
                    href="/blog"
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-between py-4"
                  >
                    <span className="font-display text-[1.4rem] font-bold text-white transition-colors group-hover:text-aqua-200">
                      Blog
                    </span>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-aqua-200 transition-all group-hover:border-aqua-300/50 group-hover:bg-white/5" aria-hidden="true">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </Link>
                </motion.li>
              </ul>

              <motion.div
                initial={reduced ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, duration: 0.3 }}
                className="mt-8"
              >
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    trackEvent('WHATSAPP_CLICK', 'menu-mobile');
                    setOpen(false);
                  }}
                  className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-action text-base font-bold text-white shadow-cta"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                  {ctaPrimary}
                </a>
                {phoneDisplay && (
                  <a
                    href={`tel:+${whatsappIntl}`}
                    className="mt-3 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border border-white/15 text-[15px] font-semibold text-blue-100"
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    {phoneDisplay}
                  </a>
                )}

                {/* Instagram + Área administrativa */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-white/15 text-[14.5px] font-semibold text-blue-100 transition-colors hover:border-aqua-300/50 hover:text-white"
                    >
                      <Instagram className="h-4.5 w-4.5" aria-hidden="true" />
                      Instagram
                    </a>
                  )}
                  <Link
                    href="/admin"
                    className={`flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-white/15 text-[14.5px] font-semibold text-blue-100 transition-colors hover:border-aqua-300/50 hover:text-white ${instagramUrl ? '' : 'col-span-2'}`}
                  >
                    <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                    Área administrativa
                  </Link>
                </div>
                <p className="mt-6 text-center text-[13px] leading-relaxed text-blue-100/50">
                  {brand.tagline} · Atendimento a domicílio
                </p>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
