import Image from 'next/image';
import { Home, Layers, MessageCircle, ClipboardCheck, Truck, Check } from 'lucide-react';
import { Reveal } from './reveal';

const ICONS: Record<string, typeof Home> = {
  home: Home,
  layers: Layers,
  'message-circle': MessageCircle,
  'clipboard-check': ClipboardCheck,
  truck: Truck,
};

const BENEFITS = [
  { title: 'Ambiente mais saudável', text: 'Remove da superfície o que o uso diário acumula nas fibras — importante para crianças, pets e quem tem alergia.' },
  { title: 'Aspecto de novo', text: 'Tecido com cor recuperada, sem manchas aparentes e com aquele aspecto de estofado cuidado.' },
  { title: 'Mais vida útil', text: 'A higienização regular preserva as fibras e adia a necessidade de trocar o estofado.' },
  { title: 'Casa cheirando a limpo', text: 'Sem odores impregnados no enchimento — o ambiente volta a ficar fresco.' },
];

const CARES = ['Avaliação do tecido antes de começar', 'Produtos adequados a cada material', 'Orientação de secagem no final'];

export function DifferentialsSection({
  data,
  freePickupVisible,
}: {
  data: { title: string; text: string; items: { icon: string; title: string; text: string }[] };
  freePickupVisible: boolean;
}) {
  return (
    <section id="diferenciais" className="scroll-mt-24 bg-white py-20 sm:py-24 lg:py-32" aria-labelledby="diferenciais-titulo">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          {/* coluna esquerda: título + texto + foto */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-action">Diferenciais</p>
              <h2
                id="diferenciais-titulo"
                className="font-display mt-3 text-balance text-[2rem] font-extrabold leading-[1.12] text-deep sm:text-[2.6rem]"
              >
                {data.title}
              </h2>
              <p className="mt-5 max-w-md text-pretty text-[17px] leading-relaxed text-ink-soft">{data.text}</p>

              {freePickupVisible && (
                <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-aqua-200 bg-aqua-50 px-5 py-2.5 text-sm font-bold text-brand-700">
                  <Truck className="h-4.5 w-4.5" aria-hidden="true" />
                  Sem taxa de deslocamento
                </div>
              )}
            </Reveal>

            {/* foto da equipe */}
            <Reveal delay={0.1} className="mt-9 hidden lg:block">
              <div className="relative">
                <div aria-hidden="true" className="absolute -bottom-3 -right-3 h-full w-full rounded-[26px] border-2 border-aqua-200/70" />
                <div className="relative overflow-hidden rounded-[26px] shadow-lift ring-1 ring-deep/[0.06]">
                  <Image
                    src="/img/site/equipe-sofa.webp"
                    alt="Profissional da JC Lavagem a Seco higienizando um sofá de tecido com equipamento de extração"
                    width={1152}
                    height={928}
                    sizes="440px"
                    className="h-auto w-full object-cover"
                  />
                </div>
                <div className="absolute bottom-4 left-4 rounded-2xl glass-dark px-4 py-2.5 ring-1 ring-white/15">
                  <p className="text-[12.5px] font-bold text-white">Quem atende você</p>
                  <p className="text-[11.5px] text-blue-100/75">Equipe própria, atendimento a domicílio</p>
                </div>
              </div>
            </Reveal>
          </div>

          {/* coluna direita: cards */}
          <div>
            <ul className="grid gap-5 sm:grid-cols-2">
              {data.items.map((item, i) => {
                const Icon = ICONS[item.icon] ?? Home;
                return (
                  <Reveal as="li" key={item.title} delay={0.07 * i}>
                    <div className="group h-full rounded-[26px] border border-border bg-ice p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-aqua-200 hover:bg-white hover:shadow-lift sm:p-8">
                      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand shadow-soft transition-colors duration-300 group-hover:bg-deep group-hover:text-aqua-200">
                        <Icon className="h-6.5 w-6.5" aria-hidden="true" />
                      </span>
                      <h3 className="font-display mt-6 text-xl font-bold text-deep">{item.title}</h3>
                      <p className="mt-2.5 text-[15px] leading-relaxed text-ink-soft">{item.text}</p>
                    </div>
                  </Reveal>
                );
              })}
            </ul>

            {/* ---------- benefícios e cuidados ---------- */}
            <Reveal delay={0.1} className="mt-6 sm:mt-8">
              <div className="relative overflow-hidden rounded-[30px] bg-hero-navy p-7 text-white shadow-deep sm:p-10">
                <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-aqua-300/15 blur-[80px]" />
                <div className="relative">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-aqua-300">Benefícios</p>
                  <h3 className="font-display mt-2.5 text-balance text-[1.55rem] font-extrabold leading-[1.15] sm:text-[1.85rem]">
                    O que a higienização regular faz pelo seu dia a dia
                  </h3>

                  <ul className="mt-7 grid gap-4 sm:grid-cols-2">
                    {BENEFITS.map((b) => (
                      <li key={b.title} className="flex items-start gap-3.5 rounded-2xl bg-white/[0.06] p-4.5 ring-1 ring-white/10">
                        <span className="mt-0.5 inline-flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full bg-aqua-300 text-deep-800" aria-hidden="true">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                        <div>
                          <p className="text-[14.5px] font-bold text-white">{b.title}</p>
                          <p className="mt-1 text-[13px] leading-relaxed text-blue-100/75">{b.text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 border-t border-white/10 pt-6">
                    <p className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-blue-100/60">
                      Cuidados em todo atendimento
                    </p>
                    <ul className="mt-3.5 flex flex-wrap gap-2.5">
                      {CARES.map((c) => (
                        <li
                          key={c}
                          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-[12.5px] font-semibold text-blue-100"
                        >
                          <Check className="h-3.5 w-3.5 text-aqua-300" aria-hidden="true" strokeWidth={3} />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
