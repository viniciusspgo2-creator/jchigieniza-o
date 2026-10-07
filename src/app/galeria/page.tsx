import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/constants';
import Image from 'next/image';
import { db } from '@/lib/db';
import { getSiteData, type SiteData } from '@/lib/site-content';
import { PublicShell } from '@/components/site/public-shell';
import { VideoFrame } from '@/components/site/video-frame';
import { GalleryGrid } from '@/components/site/gallery-grid';
import { Reveal } from '@/components/site/reveal';
import { PageTracker } from '@/components/site/analytics';
import { MessageCircle, Images, PlayCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

const SITE_URL_ABS = SITE_URL;

/** Vídeos de atendimentos (YouTube Shorts) — embeds silenciados, sem áudio. */
const VIDEOS = [
  { id: 'HNVsb9wI_6Y', title: 'Higienização em andamento' },
  { id: 'pmoGagWKFVY', title: 'Extração da sujeira do estofado' },
  { id: 'sWuzPSgq4L0', title: 'Detalhe do atendimento' },
  { id: 'lkScwKeA67g', title: 'Cuidado com cada tecido' },
  { id: 'PNgT9B691-U', title: 'Resultado do atendimento' },
];

export async function generateMetadata(): Promise<Metadata> {
  const title = 'Galeria de fotos e vídeos';
  const description =
    'Fotos e vídeos reais de higienização de sofás, colchões, carrinhos e bancos de carro pela JC Lavagem a Seco, em Goiânia e região.';
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL_ABS}/galeria` },
    openGraph: { title, description, url: `${SITE_URL_ABS}/galeria` },
  };
}

export default async function GaleriaPage() {
  // Fallbacks seguros: a página não pode quebrar com banco vazio/fora do ar.
  let site: SiteData;
  let gallery: Awaited<ReturnType<typeof db.galleryItem.findMany>> = [];
  try {
    const [s, g] = await Promise.all([
      getSiteData(),
      db.galleryItem.findMany({ where: { active: true, isComparator: false }, orderBy: { sortOrder: 'asc' } }),
    ]);
    site = s;
    gallery = g;
  } catch (e) {
    console.error('[galeria] banco indisponível — usando fallback:', e);
    site = await getSiteData(); // getSiteData não lança; garante site definido
  }

  const waLink = `https://wa.me/${site.contact.whatsappIntl}?text=${encodeURIComponent('Olá! Vi a galeria do site da JC Lavagem a Seco e gostaria de um orçamento.')}`;

  // JSON-LD ImageGallery
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: 'Galeria — JC Lavagem a Seco',
    description: 'Fotos e vídeos de atendimentos de higienização de estofados em Goiânia.',
    url: `${SITE_URL_ABS}/galeria`,
    image: gallery.slice(0, 8).map((g) => `${SITE_URL_ABS}${g.image}`),
  };

  return (
    <PublicShell whatsappIntl={site.contact.whatsappIntl} instagramUrl={site.contact.instagramUrl}>
      <PageTracker />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ---------- cabeçalho da página ---------- */}
      <section className="relative overflow-hidden bg-hero-navy pb-16 pt-[120px] text-white sm:pb-20 sm:pt-[152px]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand/25 blur-[120px]" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-aqua-300/10 blur-[110px]" />
        <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-aqua-200">Trabalhos reais</p>
            <h1 className="font-display mt-3 max-w-2xl text-balance text-[2.4rem] font-extrabold leading-[1.06] sm:text-5xl lg:text-[3.4rem]">
              Galeria de <span className="text-gradient-frost">fotos e vídeos</span>
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-[17px] leading-relaxed text-blue-100/90">
              Atendimentos reais feitos pela JC Lavagem a Seco em Goiânia e região — registrados com autorização para
              divulgação. Arraste os comparadores na página inicial e veja aqui ainda mais resultados.
            </p>
          </Reveal>

          <Reveal delay={0.1} className="mt-8 flex flex-wrap gap-3">
            <a
              href="#fotos"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-6 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:border-white/40 hover:bg-white/10"
            >
              <Images className="h-4.5 w-4.5" aria-hidden="true" />
              Ver fotos
            </a>
            <a
              href="#videos"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-6 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:border-white/40 hover:bg-white/10"
            >
              <PlayCircle className="h-4.5 w-4.5" aria-hidden="true" />
              Ver vídeos
            </a>
          </Reveal>
        </div>
      </section>

      {/* ---------- vídeos ---------- */}
      <section id="videos" className="scroll-mt-24 bg-deep-800 py-16 sm:py-20 lg:py-24" aria-labelledby="videos-titulo">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-aqua-300">Vídeos dos atendimentos</p>
            <h2 id="videos-titulo" className="font-display mt-3 text-balance text-[2rem] font-extrabold leading-[1.12] text-white sm:text-[2.4rem]">
              O serviço acontecendo na prática
            </h2>
            <p className="mt-4 text-pretty text-[16px] leading-relaxed text-blue-100/75">
              Todos os vídeos estão <strong className="font-bold text-blue-100">sem áudio</strong> — o resultado fala por si.
            </p>
          </Reveal>

          <div className="mt-12 flex flex-wrap items-start justify-center gap-6 sm:gap-7">
            {VIDEOS.map((v, i) => (
              <Reveal key={v.id} delay={0.05 * (i % 3)} className="w-[min(280px,88vw)] sm:w-[280px]">
                <VideoFrame id={v.id} title={v.title} index={i} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- fotos ---------- */}
      <section id="fotos" className="scroll-mt-24 bg-ice py-16 sm:py-20 lg:py-24" aria-labelledby="fotos-titulo">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-action">Fotos do dia a dia</p>
            <h2 id="fotos-titulo" className="font-display mt-3 text-balance text-[2rem] font-extrabold leading-[1.12] text-deep sm:text-[2.4rem]">
              Fotos de atendimentos reais
            </h2>
            <p className="mt-4 text-pretty text-[16px] leading-relaxed text-ink-soft">
              Toque em qualquer foto para ampliar. Quer ver a diferença no seu estofado? Os comparadores de antes e depois
              ficam na <a href="/#resultados" className="font-bold text-brand underline decoration-aqua-300 decoration-2 underline-offset-4 hover:text-action-600">página inicial</a>.
            </p>
          </Reveal>

          <div className="mt-12">
            <GalleryGrid items={gallery} />
          </div>

          <Reveal className="mt-10">
            <p className="mx-auto max-w-3xl text-center text-[12.5px] leading-relaxed text-ink-soft/75">
              Resultados variam conforme o tipo de tecido, o tempo de uso e a natureza da sujeira. Nenhuma técnica garante
              remoção total de qualquer mancha — cada caso é avaliado antes do atendimento.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="bg-ice pb-20 sm:pb-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-[30px] bg-hero-navy px-6 py-12 text-center text-white sm:px-12 sm:py-16">
              <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/30 blur-[90px]" />
              <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-aqua-300/15 blur-[90px]" />
              <div className="relative mx-auto max-w-xl">
                <Image
                  src="/img/brand/logo-jc-escuro.png"
                  alt="JC Lavagem a Seco"
                  width={160}
                  height={62}
                  className="mx-auto h-11 w-auto"
                />
                <h2 className="font-display mt-5 text-balance text-[1.8rem] font-extrabold leading-[1.12] sm:text-4xl">
                  Pronto para renovar seu estofado?
                </h2>
                <p className="mt-4 text-[15.5px] leading-relaxed text-blue-100/85">
                  Fale com a gente pelo WhatsApp, conte o que precisa higienizar e receba o orçamento — sem compromisso.
                </p>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 inline-flex min-h-[56px] items-center justify-center gap-2.5 rounded-full bg-action px-8 text-base font-bold text-white shadow-cta transition-all duration-200 hover:bg-action-600 hover:shadow-cta-lg"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                  Pedir orçamento no WhatsApp
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </PublicShell>
  );
}
