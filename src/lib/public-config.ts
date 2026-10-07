import 'server-only';
import { getSiteData } from './site-content';

/** Configuração pública (contato etc.) lida do conteúdo editável. */
export async function contactFromContent() {
  const site = await getSiteData();
  return {
    phoneDisplay: site.contact.phoneDisplay,
    whatsappIntl: site.contact.whatsappIntl,
    instagramUrl: site.contact.instagramUrl,
    instagram: site.contact.instagram,
    addressStreet: site.contact.addressStreet,
    addressDistrict: site.contact.addressDistrict,
    addressCity: site.contact.addressCity,
    addressState: site.contact.addressState,
    addressZip: site.contact.addressZip,
    hoursText: site.contact.hoursText,
    areaText: site.contact.areaText,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${site.contact.addressStreet}, ${site.contact.addressDistrict}, ${site.contact.addressCity}-${site.contact.addressState}, ${site.contact.addressZip}`,
    )}`,
  };
}

export const PUBLIC_WHATSAPP_FALLBACK = '5562991579369';
