import { MapPin, Phone, Instagram, Clock, Truck, ArrowUpRight } from 'lucide-react';
import { Reveal } from './reveal';
import { WaButton } from './wa-button';
import { MessageCircle } from 'lucide-react';

type Contact = {
  phoneDisplay: string;
  whatsappIntl: string;
  instagram: string;
  instagramUrl: string;
  addressStreet: string;
  addressDistrict: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  hoursText: string;
  areaText: string;
  mapsUrl: string;
};

export function ContactSection({
  intro,
  contact,
  freePickupVisible,
}: {
  intro: { title: string; text: string };
  contact: Contact;
  freePickupVisible: boolean;
}) {
  return (
    <section id="contato" className="scroll-mt-24 bg-white py-20 sm:py-24 lg:py-32" aria-labelledby="contato-titulo">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-action">Contato</p>
          <h2
            id="contato-titulo"
            className="font-display mt-3 text-balance text-[2rem] font-extrabold leading-[1.12] text-deep sm:text-[2.6rem]"
          >
            {intro.title}
          </h2>
          <p className="mt-5 text-pretty text-[17px] leading-relaxed text-ink-soft">{intro.text}</p>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:mt-16 lg:grid-cols-3">
          {/* WhatsApp — destaque vermelho */}
          <Reveal>
            <div className="relative h-full overflow-hidden rounded-[28px] border-2 border-action/15 bg-gradient-to-b from-action/[0.04] to-white p-8 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift">
              <div aria-hidden="true" className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-action/[0.07] blur-2xl" />
              <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-action text-white shadow-cta">
                <Phone className="h-6.5 w-6.5" aria-hidden="true" />
              </span>
              <h3 className="font-display relative mt-6 text-xl font-bold text-deep">WhatsApp / Telefone</h3>
              <p className="relative mt-1.5 font-display text-[1.35rem] font-extrabold text-deep">{contact.phoneDisplay}</p>
              <p className="relative mt-1 text-sm text-ink-soft">{contact.hoursText}</p>
              <div className="relative mt-6 flex flex-col gap-2.5">
                <WaButton
                  href={`https://wa.me/${contact.whatsappIntl}?text=${encodeURIComponent('Olá! Vi o site da JC Lavagem a Seco e gostaria de um orçamento.')}`}
                  eventType="WHATSAPP_CLICK"
                  eventMeta="contato"
                  className="w-full"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden="true" /> Chamar no WhatsApp
                </WaButton>
                <a
                  href={`tel:+${contact.whatsappIntl}`}
                  className="inline-flex min-h-[52px] items-center justify-center rounded-full border-2 border-deep/10 bg-white px-5 text-[15px] font-bold text-deep transition-colors duration-200 hover:border-brand hover:text-brand"
                >
                  Ligar agora
                </a>
              </div>
            </div>
          </Reveal>

          {/* Endereço */}
          <Reveal delay={0.07}>
            <div className="h-full rounded-[28px] border border-border bg-ice p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-aqua-200 hover:shadow-lift">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand shadow-soft">
                <MapPin className="h-6.5 w-6.5" aria-hidden="true" />
              </span>
              <h3 className="font-display mt-6 text-xl font-bold text-deep">Endereço</h3>
              <address className="mt-1.5 not-italic text-[15px] leading-relaxed text-ink-soft">
                {contact.addressStreet}
                <br />
                {contact.addressDistrict}
                <br />
                {contact.addressCity} – {contact.addressState}, CEP {contact.addressZip}
              </address>
              <p className="mt-4 flex items-start gap-2.5 text-sm leading-relaxed text-ink-soft">
                <Clock className="mt-0.5 h-4.5 w-4.5 shrink-0 text-brand" aria-hidden="true" />
                {contact.areaText}
              </p>
              {freePickupVisible && (
                <p className="mt-2.5 flex items-center gap-2 text-sm font-bold text-brand-700">
                  <Truck className="h-4.5 w-4.5" aria-hidden="true" /> Sem taxa de deslocamento
                </p>
              )}
              <a
                href={contact.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-6 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border-2 border-deep/10 bg-white px-5 text-[15px] font-bold text-deep transition-colors duration-200 hover:border-brand hover:text-brand"
              >
                Abrir no Google Maps
                <ArrowUpRight className="h-4.5 w-4.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </a>
            </div>
          </Reveal>

          {/* Instagram — navy */}
          <Reveal delay={0.14}>
            <div className="relative h-full overflow-hidden rounded-[28px] bg-hero-navy p-8 text-white shadow-deep">
              <div aria-hidden="true" className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-brand/30 blur-[80px]" />
              <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-aqua-200 ring-1 ring-white/15">
                <Instagram className="h-6.5 w-6.5" aria-hidden="true" />
              </span>
              <h3 className="font-display relative mt-6 text-xl font-bold">Instagram</h3>
              <p className="relative mt-1.5 break-all text-[15px] font-bold text-aqua-200">@{contact.instagram}</p>
              <p className="relative mt-3 text-[15px] leading-relaxed text-blue-100/85">
                Antes e depois dos atendimentos, dicas de conservação e novidades.
              </p>
              <a
                href={contact.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative mt-6 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-[15px] font-bold text-deep transition-colors duration-200 hover:bg-aqua-100"
              >
                <Instagram className="h-4.5 w-4.5" aria-hidden="true" />
                Seguir no Instagram
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
