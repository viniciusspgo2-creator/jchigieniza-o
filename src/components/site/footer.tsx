import Link from 'next/link';
import Image from 'next/image';
import { Instagram, MessageCircle, MapPin, ArrowUpRight } from 'lucide-react';

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

export function Footer({
  brand,
  contact,
  visibleSections,
}: {
  brand: { name: string; tagline: string; logoDark: string };
  contact: {
    phoneDisplay: string;
    whatsappIntl: string;
    instagramUrl: string;
    instagram: string;
    addressStreet: string;
    addressDistrict: string;
    addressCity: string;
    addressState: string;
    addressZip: string;
    hoursText?: string;
  };
  visibleSections: string[];
}) {
  return (
    <footer className="mt-auto bg-deep-800 text-blue-100/75">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* marca */}
          <div>
            <Image src={brand.logoDark} alt={`Logotipo ${brand.name}`} width={180} height={69} className="h-12 w-auto" />
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed">
              {brand.tagline}. Atendimento a domicílio em {contact.addressCity} e região, com avaliação cuidadosa de cada
              estofado antes do serviço.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href={`https://wa.me/${contact.whatsappIntl}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Conversar no WhatsApp"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.07] text-aqua-200 ring-1 ring-white/10 transition-all duration-200 hover:bg-action hover:text-white hover:ring-action"
              >
                <MessageCircle className="h-[18px] w-[18px]" aria-hidden="true" />
              </a>
              <a
                href={contact.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Seguir no Instagram"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.07] text-aqua-200 ring-1 ring-white/10 transition-all duration-200 hover:bg-white hover:text-deep"
              >
                <Instagram className="h-[18px] w-[18px]" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* navegação */}
          <nav aria-label="Rodapé — navegação">
            <h2 className="font-display text-[13px] font-extrabold uppercase tracking-[0.18em] text-white">Navegação</h2>
            <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-[14.5px] md:grid-cols-1">
              {visibleSections.map((id) => (
                <li key={id}>
                  <a href={`/#${id}`} className="transition-colors duration-200 hover:text-white">
                    {NAV_LABELS[id] ?? id}
                  </a>
                </li>
              ))}
              <li>
                <Link href="/galeria" className="transition-colors duration-200 hover:text-white">
                  Galeria
                </Link>
              </li>
              <li>
                <Link href="/blog" className="transition-colors duration-200 hover:text-white">
                  Artigos
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="transition-colors duration-200 hover:text-white">
                  Política de privacidade
                </Link>
              </li>
            </ul>
          </nav>

          {/* contato */}
          <div>
            <h2 className="font-display text-[13px] font-extrabold uppercase tracking-[0.18em] text-white">Contato</h2>
            <ul className="mt-5 space-y-3.5 text-[14.5px]">
              <li>
                <a
                  href={`https://wa.me/${contact.whatsappIntl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-white transition-colors duration-200 hover:text-aqua-200"
                >
                  {contact.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={contact.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all transition-colors duration-200 hover:text-white"
                >
                  @{contact.instagram}
                </a>
              </li>
              <li className="text-blue-100/60">
                <span className="font-semibold text-blue-100/80">Pagamento facilitado</span>
                <br />
                Pix, dinheiro e cartões
              </li>
              {contact.hoursText && <li className="text-blue-100/60">{contact.hoursText}</li>}
              <li className="flex items-start gap-2 leading-relaxed">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-aqua-300/70" aria-hidden="true" />
                <span>
                  {contact.addressStreet}, {contact.addressDistrict}
                  <br />
                  {contact.addressCity} – {contact.addressState}, CEP {contact.addressZip}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/[0.08] pt-7 text-[13px] sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} {brand.name}. Todos os direitos reservados.</p>
          <a
            href="/admin"
            className="group inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 font-semibold text-blue-100/45 transition-colors duration-200 hover:border-white/30 hover:text-white"
          >
            Painel administrativo
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
