import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/constants';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getSiteData } from '@/lib/site-content';
import { PageTracker } from '@/components/site/analytics';
import { PublicShell } from '@/components/site/public-shell';
import ReactMarkdown from 'react-markdown';
import { MessageCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

const SITE_URL_ABS = SITE_URL;

async function getPost(slug: string) {
  try {
    return await db.post.findFirst({
      where: { slug, status: 'PUBLISHED' },
    });
  } catch (e) {
    console.error('[blog/artigo] banco indisponível:', e);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Artigo não encontrado' };
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, site] = await Promise.all([getPost(slug), getSiteData()]);
  if (!post) notFound();

  const related = await db.post
    .findMany({
      where: { status: 'PUBLISHED', slug: { not: slug } },
      orderBy: { publishedAt: 'desc' },
      take: 3,
      select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, coverAlt: true },
    })
    .catch((e) => {
      console.error('[blog/artigo] relacionados indisponíveis:', e);
      return [] as Awaited<ReturnType<typeof db.post.findMany>>;
    });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    image: post.coverImage ? `${SITE_URL_ABS}${post.coverImage}` : undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { '@type': 'Organization', name: post.authorName },
    publisher: { '@type': 'Organization', name: site.brand.name },
    mainEntityOfPage: `${SITE_URL_ABS}/blog/${post.slug}`,
  };

  return (
    <PublicShell whatsappIntl={site.contact.whatsappIntl} instagramUrl={site.contact.instagramUrl}>
      <PageTracker />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="bg-white">
        {/* Cabeçalho do artigo */}
        <header className="relative overflow-hidden bg-hero-navy py-16 text-white sm:py-24">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-brand/25 blur-[120px]" />
          <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
            <Link
              href="/blog"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 text-sm font-bold text-aqua-200 backdrop-blur-sm transition-colors hover:border-white/35 hover:text-white"
            >
              ← Voltar ao blog
            </Link>
            <h1 className="font-display mt-6 text-balance text-[2rem] font-extrabold leading-[1.14] tracking-tight sm:text-[2.75rem]">
              {post.title}
            </h1>
            <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] text-blue-100/85">
              <span className="font-bold text-aqua-200">{post.authorName}</span>
              <span>
                Publicado em{' '}
                <time dateTime={post.publishedAt?.toISOString()}>
                  {post.publishedAt?.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </time>
              </span>
            </p>
          </div>
        </header>

        {/* Capa */}
        {post.coverImage && (
          <div className="mx-auto -mt-8 max-w-4xl px-4 sm:px-6">
            { }
            <img
              src={post.coverImage}
              alt={post.coverAlt || post.title}
              className="aspect-[16/8] w-full rounded-[28px] border-4 border-white object-cover shadow-lift"
              fetchPriority="high"
            />
          </div>
        )}

        {/* Corpo */}
        <div className="prose-article mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-18">
          <ReactMarkdown>{post.content}</ReactMarkdown>

          {/* CTA contextual */}
          <div className="relative mt-14 overflow-hidden rounded-[28px] bg-band-navy p-8 text-white shadow-deep sm:p-10">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-aqua-300/15 blur-[80px]" />
            <h2 className="font-display relative text-[1.45rem] font-extrabold">Prefere deixar com quem entende?</h2>
            <p className="relative mt-3 text-[15px] leading-relaxed text-blue-100/85">
              A JC Lavagem a Seco atende a domicílio em Goiânia. Chame no WhatsApp, conte sobre seu estofado e receba a
              avaliação — sem compromisso.
            </p>
            <a
              href={`https://wa.me/${site.contact.whatsappIntl}?text=${encodeURIComponent(`Olá! Li o artigo "${post.title}" no site e gostaria de um orçamento.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative mt-6 inline-flex min-h-[56px] items-center gap-2.5 rounded-full bg-action px-7 text-base font-bold text-white shadow-cta transition-all hover:bg-action-600 hover:shadow-cta-lg"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              Pedir orçamento no WhatsApp
            </a>
          </div>
        </div>

        {/* Relacionados */}
        {related.length > 0 && (
          <section className="border-t border-border bg-ice py-14 sm:py-16" aria-label="Artigos relacionados">
            <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
              <h2 className="font-display text-[1.6rem] font-extrabold text-deep">Continue lendo</h2>
              <ul className="mt-8 grid gap-6 sm:grid-cols-3">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/blog/${r.slug}`}
                      className="group block h-full overflow-hidden rounded-[24px] bg-white shadow-soft ring-1 ring-deep/[0.05] transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                    >
                      <div className="aspect-[16/10] overflow-hidden">
                        { }
                        <img
                          src={r.coverImage ?? '/img/blog/sofa-goiania.webp'}
                          alt={r.coverAlt ?? r.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <p className="font-display p-5 text-[15px] font-extrabold leading-snug text-deep group-hover:text-brand">{r.title}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </article>
    </PublicShell>
  );
}
