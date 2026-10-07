import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getSiteData } from '@/lib/site-content';
import { PageTracker } from '@/components/site/analytics';
import { PublicShell } from '@/components/site/public-shell';
import { ArrowUpRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteData();
  return {
    title: `${site.blogIntro.title} | ${site.brand.name}`,
    description: site.blogIntro.text,
    alternates: { canonical: '/blog' },
    openGraph: {
      type: 'website',
      title: `${site.blogIntro.title} | ${site.brand.name}`,
      description: site.blogIntro.text,
      url: '/blog',
    },
  };
}

export default async function BlogIndexPage() {
  // Fallback seguro: build/deploy não pode quebrar com banco vazio ou fora do ar.
  const [posts, site] = await Promise.all([
    db.post
      .findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, coverAlt: true, publishedAt: true, authorName: true },
      })
      .catch((e) => {
        console.error('[blog] banco indisponível — usando lista vazia:', e);
        return [] as Awaited<ReturnType<typeof db.post.findMany>>;
      }),
    getSiteData(),
  ]);

  const [first, ...rest] = posts;

  return (
    <PublicShell whatsappIntl={site.contact.whatsappIntl} instagramUrl={site.contact.instagramUrl}>
      <PageTracker />
      <main id="conteudo">
        <section className="bg-hero-navy py-16 text-white sm:py-24" aria-labelledby="blog-titulo">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-aqua-300">Blog</p>
            <h1
              id="blog-titulo"
              className="font-display mt-3 max-w-2xl text-balance text-[2.1rem] font-extrabold leading-[1.12] sm:text-[2.9rem]"
            >
              {site.blogIntro.title}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-[17px] leading-relaxed text-blue-100/85">{site.blogIntro.text}</p>
          </div>
        </section>

        <section className="bg-ice py-14 sm:py-20" aria-label="Artigos publicados">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
            {posts.length === 0 ? (
              <p className="rounded-[24px] border border-dashed border-border bg-white px-6 py-16 text-center text-ink-soft">
                Novos artigos em breve — enquanto isso, dúvidas? Chame no WhatsApp.
              </p>
            ) : (
              <div className="grid gap-6">
                {first && (
                  <Link
                    href={`/blog/${first.slug}`}
                    className="group grid overflow-hidden rounded-[28px] bg-white shadow-soft ring-1 ring-deep/[0.05] transition-all duration-300 hover:-translate-y-1 hover:shadow-lift md:grid-cols-2"
                  >
                    <div className="relative aspect-16/10 bg-ice md:aspect-auto md:min-h-80">
                      {first.coverImage && (
                        <Image
                          src={first.coverImage}
                          alt={first.coverAlt || first.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          priority
                        />
                      )}
                      <span className="absolute left-5 top-5 rounded-full glass-dark px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white">
                        Destaque
                      </span>
                    </div>
                    <div className="flex flex-col justify-center p-7 sm:p-10">
                      <h2 className="font-display text-balance text-[1.6rem] font-extrabold leading-snug text-deep transition-colors group-hover:text-brand sm:text-[1.9rem]">
                        {first.title}
                      </h2>
                      <p className="mt-4 text-pretty text-[15.5px] leading-relaxed text-ink-soft">{first.excerpt}</p>
                      <p className="mt-5 text-[13px] font-medium text-ink-soft/75">
                        {first.authorName}
                        {first.publishedAt
                          ? ` · ${new Date(first.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`
                          : ''}
                      </p>
                      <span className="mt-6 inline-flex min-h-[48px] w-fit items-center gap-2 rounded-full bg-ice px-6 text-sm font-bold text-brand transition-colors group-hover:bg-deep group-hover:text-aqua-200">
                        Ler artigo completo
                        <ArrowUpRight className="h-4.5 w-4.5" aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                )}

                {rest.length > 0 && (
                  <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {rest.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/blog/${p.slug}`}
                          className="group flex h-full flex-col overflow-hidden rounded-[24px] bg-white shadow-soft ring-1 ring-deep/[0.05] transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                        >
                          <div className="relative aspect-16/10 bg-ice">
                            {p.coverImage && (
                              <Image
                                src={p.coverImage}
                                alt={p.coverAlt || p.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 33vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                              />
                            )}
                          </div>
                          <div className="flex flex-1 flex-col p-6">
                            <h2 className="font-display line-clamp-2 text-[1.1rem] font-extrabold leading-snug text-deep transition-colors group-hover:text-brand">
                              {p.title}
                            </h2>
                            <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-ink-soft">{p.excerpt}</p>
                            <p className="mt-auto pt-5 text-xs font-medium text-ink-soft/75">
                              {p.publishedAt
                                ? new Date(p.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                : ''}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
