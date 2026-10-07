import Image from 'next/image';
import Link from 'next/link';
import { House, Instagram, LockKeyhole, MessageCircle } from 'lucide-react';
import { WaFloat } from './wa-float';

/**
 * Cabeçalho/rodapé compactos compartilhados por galeria, blog, artigos e
 * privacidade. Inclui o botão flutuante do WhatsApp (presente em todas as
 * páginas) e atalhos para Instagram e área administrativa.
 */
export function PublicShell({
  children,
  whatsappIntl,
  instagramUrl,
}: {
  children: React.ReactNode;
  whatsappIntl: string;
  instagramUrl?: string;
}) {
  const waLink = `https://wa.me/${whatsappIntl}?text=${encodeURIComponent('Olá! Vi o site da JC Lavagem a Seco e gostaria de um orçamento.')}`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="glass-light sticky top-0 z-50 border-b border-white/60 shadow-soft">
        <div className="mx-auto flex h-[76px] max-w-[1200px] items-center justify-between gap-4 px-4 sm:h-20 sm:px-6">
          <Link href="/" aria-label="JC Lavagem a Seco — página inicial" className="flex shrink-0 items-center">
            <Image src="/img/brand/logo-jc-claro.png" alt="JC Lavagem a Seco" width={180} height={69} className="h-10 w-auto sm:h-12" priority />
          </Link>
          <div className="flex items-center gap-2">
            {/* Início — volta para a página inicial a partir de galeria, blog etc. */}
            <Link
              href="/"
              aria-label="Voltar para a página inicial"
              title="Página inicial"
              className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-deep px-5 text-[15px] font-bold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand hover:shadow-lift"
            >
              <House className="h-[18px] w-[18px]" aria-hidden="true" />
              Início
            </Link>
            <Link
              href="/galeria"
              className="hidden min-h-[52px] items-center rounded-full px-4 text-[15px] font-semibold text-deep transition-colors hover:bg-deep/[0.06] sm:inline-flex"
            >
              Galeria
            </Link>
            <Link
              href="/blog"
              className="hidden min-h-[52px] items-center rounded-full px-4 text-[15px] font-semibold text-ink-soft transition-colors hover:bg-deep/[0.06] hover:text-deep sm:inline-flex"
            >
              Artigos
            </Link>
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Seguir a JC Lavagem a Seco no Instagram"
                title="Seguir no Instagram"
                className="hidden h-11 w-11 items-center justify-center rounded-full text-deep ring-1 ring-deep/10 transition-all duration-200 hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7] hover:text-white hover:ring-transparent sm:inline-flex"
              >
                <Instagram className="h-[19px] w-[19px]" aria-hidden="true" />
              </a>
            )}
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden min-h-[52px] items-center gap-2 rounded-full bg-action px-6 text-[15px] font-bold text-white shadow-cta transition-all duration-200 hover:bg-action-600 hover:shadow-cta-lg sm:inline-flex"
            >
              <MessageCircle className="h-[18px] w-[18px]" aria-hidden="true" />
              Pedir orçamento
            </a>
            <Link
              href="/admin"
              aria-label="Área administrativa"
              title="Área administrativa"
              className="hidden h-11 w-11 items-center justify-center rounded-full text-ink-soft/70 ring-1 ring-deep/10 transition-all duration-200 hover:bg-deep/[0.06] hover:text-deep sm:inline-flex"
            >
              <LockKeyhole className="h-[17px] w-[17px]" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>
      <main id="conteudo" className="flex-1">{children}</main>
      <footer className="mt-auto border-t border-white/[0.06] bg-deep-800 py-10 text-blue-100/70">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-4 px-4 text-sm sm:flex-row sm:items-center sm:px-6">
          <p>© {new Date().getFullYear()} JC Lavagem a Seco — Higienização de estofados em Goiânia.</p>
          <div className="flex gap-6 font-semibold">
            <Link href="/" className="transition-colors hover:text-white">
              Página inicial
            </Link>
            <Link href="/galeria" className="transition-colors hover:text-white">
              Galeria
            </Link>
            <Link href="/privacidade" className="transition-colors hover:text-white">
              Privacidade
            </Link>
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
              WhatsApp
            </a>
          </div>
        </div>
      </footer>
      <WaFloat whatsappIntl={whatsappIntl} />
    </div>
  );
}
