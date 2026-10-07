'use client';

import {
  MessageCircle,
  Armchair,
  Baby,
  Car,
  Shield,
  Sofa,
  BedDouble,
  CircleDot,
  Layers,
  ShieldCheck,
  Rabbit,
  CarFront,
  Droplets,
  Wind,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react';
import { Reveal } from './reveal';
import { trackEvent } from './analytics';

type Service = { id: string; name: string; slug: string; description: string; whatsappMsg: string | null };
type Category = { id: string; name: string; slug: string; description: string | null; icon?: string | null; services: Service[] };

const CAT_ICONS: Record<string, LucideIcon> = {
  armchair: Armchair,
  baby: Baby,
  car: Car,
  shield: Shield,
};

/** Ícone por serviço (heurística por slug, com fallback do ícone da categoria). */
const SERVICE_ICONS: Record<string, LucideIcon> = {
  'higienizacao-de-sofas': Sofa,
  'colchoes-e-camas-box': BedDouble,
  'cadeiras-e-poltronas': Armchair,
  'puffs': CircleDot,
  'tapetes-e-carpetes': Layers,
  'carrinhos-de-bebe': Baby,
  'bebe-conforto': ShieldCheck,
  'ursos-de-pelucia': Rabbit,
  'bancos-de-carro-e-interior-veicular': Car,
  'lavagem-de-carro': CarFront,
  'impermeabilizacao-de-estofados': Droplets,
  'lavagem-a-seco': Wind,
};

function ServiceCard({
  service,
  whatsappIntl,
  tone = 'light',
  featured = false,
}: {
  service: Service;
  whatsappIntl: string;
  tone?: 'light' | 'dark' | 'aqua';
  featured?: boolean;
}) {
  const Icon = SERVICE_ICONS[service.slug] ?? Armchair;
  const waLink = `https://wa.me/${whatsappIntl}?text=${encodeURIComponent(service.whatsappMsg || `Olá! Gostaria de um orçamento para *${service.name}*.`)}`;

  const tones = {
    light: 'border-border bg-white hover:border-aqua-200 hover:shadow-lift',
    dark: 'border-white/12 bg-white/[0.07] hover:border-aqua-300/40 hover:bg-white/[0.11]',
    aqua: 'border-aqua-100 bg-aqua-50/70 hover:border-aqua-200 hover:shadow-lift',
  };
  const iconTones = {
    light: 'bg-aqua-50 text-brand group-hover:bg-deep group-hover:text-aqua-200',
    dark: 'bg-white/10 text-aqua-200 group-hover:bg-aqua-300/25',
    aqua: 'bg-white text-brand group-hover:bg-deep group-hover:text-aqua-200',
  };
  const titleTones = { light: 'text-deep', dark: 'text-white', aqua: 'text-deep' };
  const textTones = { light: 'text-ink-soft', dark: 'text-blue-100/80', aqua: 'text-ink-soft' };
  const linkTones = {
    light: 'text-action group-hover:text-action-600',
    dark: 'text-aqua-200 group-hover:text-aqua-100',
    aqua: 'text-action group-hover:text-action-600',
  };

  return (
    <a
      href={waLink}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent('WHATSAPP_CLICK', `servico:${service.slug}`)}
      className={`group flex h-full flex-col rounded-[24px] border p-6 transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:p-7 ${tones[tone]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300 ${
            featured ? 'h-14 w-14' : ''
          } ${iconTones[tone]}`}
          aria-hidden="true"
        >
          <Icon className={featured ? 'h-7 w-7' : 'h-6 w-6'} />
        </span>
        <ArrowUpRight
          className="h-5 w-5 shrink-0 text-ink-soft/30 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-current"
          aria-hidden="true"
        />
      </div>
      <h4 className={`font-display mt-5 text-lg font-bold leading-snug sm:text-xl ${titleTones[tone]}`}>{service.name}</h4>
      <p className={`mt-2 line-clamp-3 flex-1 text-[14.5px] leading-relaxed ${textTones[tone]}`}>{service.description}</p>
      <span className={`mt-5 inline-flex items-center gap-1.5 text-sm font-bold ${linkTones[tone]}`}>
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        Pedir orçamento
      </span>
    </a>
  );
}

function CategoryHeader({
  index,
  name,
  description,
  dark = false,
}: {
  index: number;
  name: string;
  description: string | null;
  dark?: boolean;
}) {
  return (
    <Reveal className="max-w-2xl">
      <p
        className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.16em] ${
          dark ? 'bg-white/10 text-aqua-200' : 'bg-aqua-50 text-brand'
        }`}
      >
        <span aria-hidden="true" className="font-mono">{String(index + 1).padStart(2, '0')}</span>
        {name}
      </p>
      {description && (
        <p className={`mt-3 text-pretty text-[15.5px] leading-relaxed ${dark ? 'text-blue-100/80' : 'text-ink-soft'}`}>
          {description}
        </p>
      )}
    </Reveal>
  );
}

export function ServicesSection({
  title,
  text,
  categories,
  whatsappIntl,
}: {
  title: string;
  text: string;
  categories: Category[];
  whatsappIntl: string;
}) {
  return (
    <section id="servicos" className="scroll-mt-24 bg-white py-20 sm:py-24 lg:py-32" aria-labelledby="servicos-titulo">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-action">Serviços</p>
          <h2
            id="servicos-titulo"
            className="font-display mt-3 text-balance text-[2rem] font-extrabold leading-[1.12] text-deep sm:text-[2.6rem]"
          >
            {title}
          </h2>
          <p className="mt-5 text-pretty text-[17px] leading-relaxed text-ink-soft">{text}</p>
        </Reveal>

        <div className="mt-14 flex flex-col gap-16 sm:mt-16 sm:gap-20">
          {categories.map((cat, ci) => {
            const CatIcon = CAT_ICONS[cat.icon ?? 'armchair'] ?? Armchair;

            /* ---------- Cuidados com itens infantis: card grande navy ---------- */
            if (ci === 1) {
              return (
                <div key={cat.id} className="flex flex-col gap-8">
                  <CategoryHeader index={ci} name={cat.name} description={cat.description} />
                  <Reveal delay={0.05}>
                    <div className="relative overflow-hidden rounded-[30px] bg-hero-navy p-7 text-white shadow-deep sm:p-10 lg:p-12">
                      <BubblesHint />
                      <div className="relative grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
                        <div>
                          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-aqua-200" aria-hidden="true">
                            <CatIcon className="h-7 w-7" />
                          </span>
                          <h3 className="font-display mt-6 text-balance text-2xl font-extrabold leading-tight sm:text-[2rem]">
                            {cat.name}
                          </h3>
                          <p className="mt-4 max-w-md text-pretty text-[15.5px] leading-relaxed text-blue-100/85">
                            O que os pequenos usam todos os dias pede um cuidado extra: produtos adequados, extração
                            controlada e respeito às instruções do fabricante e aos componentes de segurança.
                          </p>
                          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-[13px] font-semibold text-aqua-100">
                            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                            Sem desmontar componentes de segurança
                          </p>
                        </div>
                        <ul className="grid gap-4">
                          {cat.services.map((s, si) => (
                            <Reveal as="li" key={s.id} delay={0.07 * si}>
                              <ServiceCard service={s} whatsappIntl={whatsappIntl} tone="dark" />
                            </Reveal>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Reveal>
                </div>
              );
            }

            /* ---------- Demais categorias: header + bento ---------- */
            return (
              <div key={cat.id} className="flex flex-col gap-8">
                <CategoryHeader index={ci} name={cat.name} description={cat.description} />

                {ci === 0 && cat.services.length >= 3 && (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {cat.services.map((s, si) => (
                      <Reveal
                        key={s.id}
                        delay={0.05 * Math.min(si, 3)}
                        className={si === 0 ? 'sm:col-span-2 lg:col-span-2' : ''}
                      >
                        <ServiceCard service={s} whatsappIntl={whatsappIntl} featured={si === 0} />
                      </Reveal>
                    ))}
                  </div>
                )}

                {ci === 2 && (
                  <div className="grid gap-5 sm:grid-cols-2">
                    {cat.services.map((s, si) => (
                      <Reveal key={s.id} delay={0.05 * si}>
                        <ServiceCard service={s} whatsappIntl={whatsappIntl} />
                      </Reveal>
                    ))}
                  </div>
                )}

                {ci === 3 && (
                  <div className="grid gap-5 sm:grid-cols-2">
                    {cat.services.map((s, si) => (
                      <Reveal key={s.id} delay={0.05 * si}>
                        <ServiceCard service={s} whatsappIntl={whatsappIntl} tone="aqua" />
                      </Reveal>
                    ))}
                  </div>
                )}

                {/* categorias além do esperado: grid simples */}
                {ci > 3 && (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {cat.services.map((s, si) => (
                      <Reveal key={s.id} delay={0.05 * Math.min(si, 3)}>
                        <ServiceCard service={s} whatsappIntl={whatsappIntl} />
                      </Reveal>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Reveal className="mt-14">
          <p className="rounded-[24px] border border-aqua-100 bg-aqua-50/60 px-6 py-5 text-center text-[15px] leading-relaxed text-ink-soft sm:px-8">
            Não sabe qual serviço se encaixa no seu caso?{' '}
            <a
              href={`https://wa.me/${whatsappIntl}?text=${encodeURIComponent('Olá! Tenho uma dúvida sobre qual serviço preciso. Pode me ajudar?')}`}
              onClick={() => trackEvent('WHATSAPP_CLICK', 'servicos:duvida')}
              className="font-bold text-brand underline underline-offset-4 transition-colors hover:text-brand-700"
            >
              Mande sua dúvida no WhatsApp
            </a>{' '}
            — a gente orienta.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/** Brilho decorativo do card infantil (CSS puro, sem canvas). */
function BubblesHint() {
  return (
    <div aria-hidden="true">
      <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-brand/30 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-20 right-10 h-52 w-52 rounded-full bg-aqua-300/15 blur-[90px]" />
    </div>
  );
}
