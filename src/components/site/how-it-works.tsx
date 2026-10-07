import { ClipboardList, Search, CalendarCheck2, Sparkles, Info } from 'lucide-react';
import { Reveal } from './reveal';

const STEP_ICONS = [ClipboardList, Search, CalendarCheck2, Sparkles];

/**
 * Passo a passo: timeline horizontal conectada no desktop, vertical no
 * mobile, sobre fundo navy profundo com contraste forte.
 */
export function HowItWorksSection({
  data,
}: {
  data: { title: string; text: string; steps: { title: string; text: string }[] };
}) {
  return (
    <section
      id="como-funciona"
      className="relative scroll-mt-24 overflow-hidden bg-hero-navy py-20 text-white sm:py-24 lg:py-32"
      aria-labelledby="como-titulo"
    >
      <div aria-hidden="true" className="pointer-events-none absolute right-[-8rem] top-[-4rem] h-96 w-96 rounded-full bg-brand/25 blur-[130px]" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-[-6rem] left-[-6rem] h-80 w-80 rounded-full bg-aqua-300/10 blur-[110px]" />

      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-aqua-300">Como funciona</p>
          <h2 id="como-titulo" className="font-display mt-3 text-balance text-[2rem] font-extrabold leading-[1.12] sm:text-[2.6rem]">
            {data.title}
          </h2>
          <p className="mt-5 text-pretty text-[17px] leading-relaxed text-blue-100/85">{data.text}</p>
        </Reveal>

        <div className="relative mt-16 sm:mt-20">
          {/* linha conectora horizontal (desktop) */}
          <div
            aria-hidden="true"
            className="absolute left-[12%] right-[12%] top-7 hidden h-px bg-gradient-to-r from-transparent via-white/25 to-transparent lg:block"
          />
          {/* linha conectora vertical (mobile) */}
          <div aria-hidden="true" className="absolute bottom-8 left-[27px] top-8 w-px bg-white/15 lg:hidden" />

          <ol className="relative grid gap-10 lg:grid-cols-4 lg:gap-6">
            {data.steps.map((step, i) => {
              const Icon = STEP_ICONS[i % STEP_ICONS.length];
              return (
                <Reveal as="li" key={step.title} delay={0.1 * i} className="relative">
                  <div className="flex gap-5 lg:flex-col lg:items-center lg:gap-0 lg:text-center">
                    {/* número + ícone */}
                    <div className="relative z-10 flex flex-col items-center">
                      <span className="font-display inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white text-[17px] font-extrabold text-deep shadow-lift">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="mt-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.08] text-aqua-300 ring-1 ring-white/10 lg:mt-5" aria-hidden="true">
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                    <div className="lg:mt-5">
                      <h3 className="font-display pt-1 text-lg font-bold leading-snug lg:pt-0 lg:text-xl">{step.title}</h3>
                      <p className="mt-2 text-[14.5px] leading-relaxed text-blue-100/80">{step.text}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </ol>
        </div>

        {/* aviso importante */}
        <Reveal className="mt-16">
          <div className="mx-auto flex max-w-3xl items-start gap-4 rounded-[24px] border border-aqua-300/25 bg-white/[0.06] p-6 backdrop-blur-sm sm:items-center sm:p-7">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-aqua-300/15 text-aqua-200" aria-hidden="true">
              <Info className="h-5.5 w-5.5" />
            </span>
            <p className="text-[14.5px] leading-relaxed text-blue-100/90">
              <strong className="font-bold text-white">Importante:</strong> enviar uma solicitação não confirma
              automaticamente o agendamento. A confirmação acontece depois que avaliamos a agenda e as condições do
              serviço — assim a gente garante o cuidado que seu estofado merece.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
