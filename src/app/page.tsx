import { db } from '@/lib/db';
import { SITE_URL } from '@/lib/constants';
import { getSiteData } from '@/lib/site-content';
import { summarizePaymentNames } from '@/lib/payments';
import { PageTracker } from '@/components/site/analytics';
import { Header } from '@/components/site/header';
import { Hero } from '@/components/site/hero';
import { ProblemSection } from '@/components/site/problem';
import { ServicesSection } from '@/components/site/services';
import { ResultsSection } from '@/components/site/results';
import { HowItWorksSection } from '@/components/site/how-it-works';
import { DifferentialsSection } from '@/components/site/differentials';
import { BookingSection } from '@/components/site/booking';
import { FaqSection } from '@/components/site/faq';
import { ContactSection } from '@/components/site/contact';
import { CtaBand } from '@/components/site/cta-band';
import { Footer } from '@/components/site/footer';
import { MobileCta } from '@/components/site/mobile-cta';
import { WaFloat } from '@/components/site/wa-float';
import { Chatbot } from '@/components/site/chatbot';

/** Consulta com fallback seguro: o build/deploy não pode quebrar se o banco estiver vazio ou fora do ar. */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.error('[home] consulta ao banco falhou, usando fallback:', e);
    return fallback;
  }
}

/** Categorias com serviços visíveis — helper para preservar o tipo com include. */
function loadCategories() {
  return db.serviceCategory.findMany({
    where: { active: true },
    include: { services: { where: { active: true, visibleOnSite: true }, orderBy: { sortOrder: 'asc' } } },
    orderBy: { sortOrder: 'asc' },
  });
}

export const dynamic = 'force-dynamic';

const SITE_URL_ABS = SITE_URL;

export default async function Home() {
  const [site, categories, faqs, gallery, payments] = await Promise.all([
    safe(getSiteData, null),
    safe(loadCategories, [] as Awaited<ReturnType<typeof loadCategories>>),
    safe(
      () => db.chatFaq.findMany({ where: { active: true, showOnSite: true }, orderBy: { sortOrder: 'asc' }, take: 8 }),
      [] as Awaited<ReturnType<typeof db.chatFaq.findMany>>,
    ),
    safe(
      () => db.galleryItem.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
      [] as Awaited<ReturnType<typeof db.galleryItem.findMany>>,
    ),
    safe(
      () => db.paymentMethod.findMany({ where: { active: true }, orderBy: { id: 'asc' } }),
      [] as Awaited<ReturnType<typeof db.paymentMethod.findMany>>,
    ),
  ]);

  if (!site) {
    // getSiteData tem defaults em código; falha aqui só ocorre se o próprio merge falhar.
    throw new Error('Conteúdo do site indisponível.');
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${site.contact.addressStreet}, ${site.contact.addressDistrict}, ${site.contact.addressCity} - ${site.contact.addressState}, ${site.contact.addressZip}`,
  )}`;

  const visibleSections = site.sectionsOrder.filter((s) => s.visible).map((s) => s.id);

  const sectionById: Record<string, React.ReactNode> = {
    'servicos': <ServicesSection key="servicos" title={site.servicesIntro.title} text={site.servicesIntro.text} categories={categories} whatsappIntl={site.contact.whatsappIntl} />,
    'resultados': <ResultsSection key="resultados" intro={site.resultsIntro} gallery={gallery} />,
    'como-funciona': <HowItWorksSection key="como-funciona" data={site.howItWorks} />,
    'diferenciais': <DifferentialsSection key="diferenciais" data={site.differentials} freePickupVisible={site.flags.freePickupVisible} />,
    'agendamento': <BookingSection key="agendamento" intro={site.bookingIntro} payments={summarizePaymentNames(payments.map((p) => p.name))} />,
    'duvidas': <FaqSection key="duvidas" intro={site.faqIntro} faqs={faqs} whatsappIntl={site.contact.whatsappIntl} />,
    // O blog é uma página separada (/blog) — não faz parte mais da página inicial.
    'contato': <ContactSection key="contato" intro={site.contactIntro} contact={{ ...site.contact, mapsUrl }} freePickupVisible={site.flags.freePickupVisible} />,
  };

  // JSON-LD LocalBusiness — somente informações reais
  const localBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: site.brand.name,
    description: site.seo.metaDescription,
    telephone: `+${site.contact.whatsappIntl}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${site.contact.addressStreet}`,
      addressLocality: `${site.contact.addressDistrict}, ${site.contact.addressCity}`,
      addressRegion: site.contact.addressState,
      postalCode: site.contact.addressZip,
      addressCountry: 'BR',
    },
    url: SITE_URL_ABS,
    sameAs: [site.contact.instagramUrl],
    openingHours: 'Mo-Sa 08:00-18:00',
    image: `${SITE_URL_ABS}/img/brand/og-image.png`,
    priceRange: '$$',
  };

  return (
    <>
      <PageTracker />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }} />
      <Header
        brand={site.brand}
        ctaPrimary={site.hero.ctaPrimary}
        whatsappIntl={site.contact.whatsappIntl}
        phoneDisplay={site.contact.phoneDisplay}
        instagramUrl={site.contact.instagramUrl}
        instagramHandle={site.contact.instagram}
        visibleSections={visibleSections}
      />
      <main id="conteudo">
        <Hero data={site.hero} scrollTarget={visibleSections[0] ? `#${visibleSections[0]}` : '#agendamento'} />
        <ProblemSection data={site.problem} />
        {visibleSections.map((id) => sectionById[id] ?? null)}
      </main>
      <CtaBand
        text={site.ctaBar.text}
        button={site.ctaBar.button}
        phoneDisplay={site.contact.phoneDisplay}
        whatsappIntl={site.contact.whatsappIntl}
      />
      <Footer brand={site.brand} contact={site.contact} visibleSections={visibleSections} />
      <MobileCta whatsappIntl={site.contact.whatsappIntl} ctaBar={site.ctaBar} />
      <WaFloat whatsappIntl={site.contact.whatsappIntl} />
      <Chatbot whatsappIntl={site.contact.whatsappIntl} />
    </>
  );
}
