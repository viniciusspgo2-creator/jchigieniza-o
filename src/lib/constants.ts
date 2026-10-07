/** Constantes globais do projeto. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');
export const WHATSAPP_INTL = '5562991579369';
export const PHONE_DISPLAY = '(62) 99157-9369';
export const INSTAGRAM_URL = 'https://www.instagram.com/jc.lavagem.a.seco.62';
export const ADDRESS = {
  street: 'Rua Sulamita, Quadra 02, Lote 38',
  district: 'Setor Morada do Sol',
  city: 'Goiânia',
  state: 'GO',
  zip: '74475-180',
};
export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${ADDRESS.street}, ${ADDRESS.district}, ${ADDRESS.city}-${ADDRESS.state}, ${ADDRESS.zip}`,
)}`;
