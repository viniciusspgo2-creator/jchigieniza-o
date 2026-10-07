import Link from 'next/link';
import { Armchair, Droplets, Baby, Car, Bug, Wind, AlarmClock, ArrowRight } from 'lucide-react';
import { Reveal } from './reveal';
import Image from 'next/image';

const ICONS = { armchair: Armchair, droplets: Droplets, baby: Baby, car: Car } as const;

const RISKS = [
  { icon: Bug, title: 'Ácaros e resíduos', text: 'Fibras de sofá e colchão retêm poeira e resíduos orgânicos — exatamente onde a família passa mais tempo em contato.' },
  { icon: Wind, title: 'Odores impregnados', text: 'Cheiro de velho, umidade e acidentes com pet ficam guardados no enchimento, não só na superfície.' },
  { icon: AlarmClock, title: 'Manchas que se fixam', text: 'Quanto mais tempo a sujeira fica no tecido, mais difícil a limpeza completa — e maior o desgaste das fibras.' },
];

/**
 * Seção de identificação da dor: 4 cards grandes em grid no desktop,
 * carrossel horizontal com snap no mobile + card de riscos com imagem.
 */
export function ProblemSection({
  data,
}: {
  data: { title: string; text: string; items: { icon: string; title: string; text: string }[] };
}) {
  return (
    <section className="relative bg-ice py-20 sm:py-24 lg:py-32" aria-labelledby="problema-titulo">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2
            id="problema-titulo"
            className="font-display text-balance text-[2rem] font-extrabold leading-[1.12] text-deep sm:text-[2.6rem]"
          >
            {data.title}
          </h2>
          <p className="mt-5 text-pretty text-[17px] leading-relaxed text-ink-soft">{data.text}</p>
        </Reveal>

        {/* Desktop: grid 4 colunas · Mobile: carrossel com snap */}
        <ul
          className="fade-edges no-scrollbar mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 sm:mt-16 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0"
          aria-label="Situações que a gente resolve"
        >
          {data.items.map((item, i) => {
            const Icon = ICONS[item.icon as keyof typeof ICONS] ?? Armchair;
            return (
              <Reveal
                as="li"
                key={item.title}
                delay={0.06 * i}
                className="min-w-[82%] snap-center sm:min-w-[46%] lg:min-w-0"
              >
                <div className="group relative h-full overflow-hidden rounded-[26px] border border-border bg-white p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-aqua-200 hover:shadow-lift sm:p-8">
                  {/* brilho decorativo no hover */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-aqua-100/70 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-aqua-50 text-brand transition-all duration-300 group-hover:bg-deep group-hover:text-aqua-200">
                    <Icon className="h-6.5 w-6.5" aria-hidden="true" />
                  </span>
                  <h3 className="font-display relative mt-6 text-xl font-bold text-deep">{item.title}</h3>
                  <p className="relative mt-2.5 text-[15px] leading-relaxed text-ink-soft">{item.text}</p>
                </div>
              </Reveal>
            );
          })}
        </ul>

        {/* dica de arraste (só mobile/tablet) */}
        <p className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft/60 lg:hidden" aria-hidden="true">
          Arraste para o lado
        </p>

        {/* ---------- riscos: o que fica escondido no estofado ---------- */}
        <Reveal className="mt-14 sm:mt-16">
          <div className="relative overflow-hidden rounded-[30px] bg-hero-navy text-white shadow-deep">
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand/25 blur-[100px]" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-aqua-300/10 blur-[90px]" />

            <div className="relative grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
              {/* imagem */}
              <div className="relative min-h-[240px] lg:min-h-full">
                <Image
                  src="/img/site/riscos-estofado.webp"
                  alt="Ilustração mostrando ácaros, bactérias e sujeira acumulada nas fibras de um sofá claro"
                  width={1024}
                  height={554}
                  sizes="(max-width: 1024px) 100vw, 540px"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-deep-800/85 via-deep-800/25 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-deep-800/20 lg:to-deep-800" />
                <span className="absolute left-5 top-5 rounded-full glass-dark px-3.5 py-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-white ring-1 ring-white/15">
                  Muito além do que os olhos veem
                </span>
              </div>

              {/* conteúdo */}
              <div className="relative p-7 sm:p-10 lg:p-12">
                <h3 className="font-display text-balance text-[1.55rem] font-extrabold leading-[1.15] sm:text-[1.9rem]">
                  O que se acumula no silêncio dos tecidos
                </h3>
                <p className="mt-4 max-w-lg text-pretty text-[15.5px] leading-relaxed text-blue-100/85">
                  O estofado é o item da casa que mais tem contato com a pele, com as roupas e com o chão — e um dos que
                  menos recebe limpeza profunda. Com o tempo, o que fica guardado nas fibras afeta o conforto, o cheiro e
                  a aparência de todo o ambiente.
                </p>

                <ul className="mt-7 grid gap-3.5 sm:grid-cols-3">
                  {RISKS.map(({ icon: Icon, title, text }) => (
                    <li key={title} className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-aqua-300/15 text-aqua-200" aria-hidden="true">
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <p className="mt-3 text-[14px] font-bold text-white">{title}</p>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-blue-100/70">{text}</p>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/#servicos"
                  className="group mt-8 inline-flex min-h-[52px] items-center gap-2 rounded-full bg-white px-7 text-[15px] font-bold text-deep transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua-300"
                >
                  Conheça nossos serviços
                  <ArrowRight className="h-4.5 w-4.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
