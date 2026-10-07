'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from './reveal';
import { BeforeAfter } from './before-after';

type GalleryItem = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  image: string;
  imageAlt: string;
  beforeImage: string | null;
  afterImage: string | null;
  isComparator: boolean;
};

/**
 * Seção de resultados: comparadores antes/depois em tamanho grande
 * (carrossel com snap no mobile, 2 colunas no desktop). As fotos e os
 * vídeos ficam na página /galeria — aqui fica o convite para ver mais.
 */
export function ResultsSection({
  intro,
  gallery,
}: {
  intro: { title: string; text: string; note: string };
  gallery: GalleryItem[];
}) {
  // A página inicial mostra apenas 2 comparadores — os demais ficam na /galeria.
  const comparators = gallery.filter((g) => g.isComparator && g.beforeImage && g.afterImage).slice(0, 2);

  if (comparators.length === 0) return null;

  return (
    <section id="resultados" className="scroll-mt-24 bg-ice py-20 sm:py-24 lg:py-32" aria-labelledby="resultados-titulo">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-action">Resultados reais</p>
          <h2
            id="resultados-titulo"
            className="font-display mt-3 text-balance text-[2rem] font-extrabold leading-[1.12] text-deep sm:text-[2.6rem]"
          >
            {intro.title}
          </h2>
          <p className="mt-5 text-pretty text-[17px] leading-relaxed text-ink-soft">{intro.text}</p>
        </Reveal>

        {/* ---------- comparadores antes/depois (arraste para o lado) ---------- */}
        <div className="mt-12 sm:mt-16">
          <div
            className="no-scrollbar fade-edges flex snap-x snap-mandatory gap-6 overflow-x-auto pb-3 lg:grid lg:grid-cols-2 lg:overflow-visible lg:pb-0"
            role="group"
            aria-label="Comparativos antes e depois — arraste ou use as setas do teclado"
          >
            {comparators.map((g, i) => (
              <Reveal
                key={g.id}
                delay={0.06 * (i % 2)}
                className="min-w-[92%] snap-center sm:min-w-[78%] lg:min-w-0"
              >
                <BeforeAfter
                  beforeSrc={g.beforeImage!}
                  afterSrc={g.afterImage!}
                  beforeAlt={`${g.title} antes da higienização`}
                  afterAlt={`${g.title} depois da higienização`}
                  label={g.title}
                />
              </Reveal>
            ))}
          </div>
          <p className="mt-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft/60 lg:hidden" aria-hidden="true">
            Arraste para ver mais
          </p>
        </div>

        {/* convite para a galeria completa */}
        <Reveal className="mt-12 text-center">
          <Link
            href="/galeria"
            className="group inline-flex min-h-[54px] items-center gap-2.5 rounded-full border-2 border-deep/12 bg-white px-8 text-[15px] font-bold text-deep shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-aqua-300 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            Ver galeria completa de fotos e vídeos
            <ArrowRight className="h-4.5 w-4.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </Reveal>

        {/* aviso discreto */}
        <Reveal className="mt-10">
          <p className="mx-auto max-w-3xl text-center text-[12.5px] leading-relaxed text-ink-soft/75">{intro.note}</p>
        </Reveal>
      </div>
    </section>
  );
}
