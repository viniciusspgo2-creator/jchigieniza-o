import 'server-only';
import { db } from './db';

/**
 * Conteúdo editável do site: defaults versionados em código, sobrepostos
 * pelos valores publicados no banco (chave a chave). Rascunhos ficam em `draft`.
 */

export const CONTACT_DEFAULTS = {
  phoneDisplay: '(62) 99157-9369',
  whatsappIntl: '5562991579369',
  instagram: 'jc.lavagem.a.seco.62',
  instagramUrl: 'https://www.instagram.com/jc.lavagem.a.seco.62',
  addressStreet: 'Rua Sulamita, Quadra 02, Lote 38',
  addressDistrict: 'Setor Morada do Sol',
  addressCity: 'Goiânia',
  addressState: 'GO',
  addressZip: '74475-180',
  hoursText: 'Segunda a sábado, das 8h às 18h',
  areaText: 'Atendimento a domicílio em Goiânia. Consulte a disponibilidade para o seu bairro.',
};

export type SiteData = {
  brand: {
    name: string;
    responsible: string;
    tagline: string;
    logoLight: string;
    logoDark: string;
  };
  contact: typeof CONTACT_DEFAULTS;
  flags: {
    /** "Sem taxa de deslocamento" — desativado até o administrador confirmar área e condições. */
    freePickupVisible: boolean;
    /** Seção "Resultados" visível (galeria/comparadores reais). */
    resultsVisible: boolean;
  };
  hero: {
    badge: string;
    title1: string;
    title2: string;
    subtitle: string;
    image: string;
    imageAlt: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  problem: {
    title: string;
    text: string;
    items: { icon: string; title: string; text: string }[];
  };
  servicesIntro: { title: string; text: string };
  resultsIntro: { title: string; text: string; note: string };
  howItWorks: {
    title: string;
    text: string;
    steps: { title: string; text: string }[];
  };
  differentials: {
    title: string;
    text: string;
    items: { icon: string; title: string; text: string }[];
  };
  bookingIntro: { title: string; text: string };
  faqIntro: { title: string; text: string };
  blogIntro: { title: string; text: string };
  contactIntro: { title: string; text: string };
  ctaBar: { text: string; button: string };
  sectionsOrder: { id: string; visible: boolean }[];
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
  };
};

export const DEFAULT_SITE: SiteData = {
  brand: {
    name: 'JC Lavagem a Seco',
    responsible: 'Jhone Costa',
    tagline: 'Higienização de estofados em geral',
    logoLight: '/img/brand/logo-jc-claro.png',
    logoDark: '/img/brand/logo-jc-escuro.png',
  },
  contact: CONTACT_DEFAULTS,
  flags: {
    freePickupVisible: false,
    resultsVisible: true,
  },
  hero: {
    badge: 'Higienização a domicílio em Goiânia',
    title1: 'Seu estofado',
    title2: 'merece um novo cuidado.',
    subtitle:
      'Higienização de sofás, colchões, cadeiras, carrinhos de bebê e interior de veículos, no conforto da sua casa. Avaliação cuidadosa de cada tecido antes de começar.',
    image: '/img/site/hero-equipe.webp',
    imageAlt: 'Equipe da JC Lavagem a Seco higienizando estofado com equipamento de extração em atendimento a domicílio',
    ctaPrimary: 'Orçamento no WhatsApp',
    ctaSecondary: 'Agendar horário',
  },
  problem: {
    title: 'Aquele cuidado que o dia a dia não deixa você ter.',
    text: 'O sofá recebe a família todo dia, o colchão acumula o que não enxergamos, e a poltrona favorita guarda marcas do tempo. Limpar bem esses itens em casa é difícil — e nem sempre basta um pano úmido.',
    items: [
      { icon: 'armchair', title: 'Uso diário', text: 'Resíduos de pele, cabelo e poeira se acumulam nas fibras e escurecem o tecido aos poucos, sem que se perceba de imediato.' },
      { icon: 'droplets', title: 'Manchas e odores', text: 'Acidentes com bebidas, pet e umidade atravessam o tecido e fixam manchas e cheiro de velho que o pano não resolve.' },
      { icon: 'baby', title: 'Crianças e pets', text: 'Quem mais usa o estofado é quem mais fica perto dele: itens dos pequenos e dos animais pedem atenção redobrada.' },
      { icon: 'car', title: 'Interior do carro', text: 'Bancos e carpetes do veículo acumulam sujeira e umidade no dia a dia — e merecem o mesmo cuidado que a casa.' },
    ],
  },
  servicesIntro: {
    title: 'Serviços para cada tipo de estofado',
    text: 'Do sofá da sala ao carrinho do bebê, cada item é higienizado com técnica adequada ao material. Escolha um serviço para pedir orçamento pelo WhatsApp.',
  },
  resultsIntro: {
    title: 'Resultados de atendimentos reais',
    text: 'Fotografias de trabalhos executados pela JC Lavagem a Seco, com autorização para divulgação.',
    note: 'Resultados variam conforme o tipo de tecido, o tempo de uso e a natureza da sujeira. Nenhuma técnica garante remoção total de qualquer mancha — cada caso é avaliado antes do atendimento.',
  },
  howItWorks: {
    title: 'Simples do pedido ao atendimento',
    text: 'Você envia a solicitação, a gente avalia e confirma o horário. Enviar a solicitação não confirma automaticamente o agendamento — a confirmação acontece depois que verificamos a agenda e as condições do serviço.',
    steps: [
      { title: 'Você solicita', text: 'Envie a solicitação pelo formulário ou chame no WhatsApp com o serviço desejado.' },
      { title: 'Avaliamos o serviço', text: 'Verificamos tipo de estofado, quantidade de itens e condições para atendimento a domicílio.' },
      { title: 'Confirmamos o horário', text: 'Com a avaliação pronta, confirmamos data e horário — por WhatsApp ou telefone.' },
      { title: 'Atendimento no seu endereço', text: 'Levamos equipamento e produtos, higienizamos no local e orientamos a secagem.' },
    ],
  },
  differentials: {
    title: 'Por que contar com a JC',
    text: 'Atributos reais do nosso atendimento — sem promessas que não podemos sustentar.',
    items: [
      { icon: 'home', title: 'Atendimento a domicílio', text: 'Você não transporta estofado nenhum: levamos equipamento e produtos e higienizamos no seu endereço, em Goiânia.' },
      { icon: 'layers', title: 'Variedade de estofados', text: 'Sofás, colchões, cadeiras, puffs, tapetes, carrinhos, bebê conforto, pelúcias e interior veicular — cada um com a técnica certa.' },
      { icon: 'message-circle', title: 'Orçamento direto no WhatsApp', text: 'Conversa direta com quem executa o serviço, com respostas rápidas, sem burocracia e sem compromisso.' },
      { icon: 'clipboard-check', title: 'Avaliação antes de tudo', text: 'Cada serviço começa pela avaliação do tecido e das condições do item — a técnica e a secagem dependem disso.' },
    ],
  },
  bookingIntro: {
    title: 'Solicite seu agendamento',
    text: 'Preencha os dados abaixo em etapas rápidas. Nosso time recebe a solicitação, avalia e confirma o horário com você — enviar o formulário não garante automaticamente a vaga na agenda. Pagamento facilitado: Pix, dinheiro ou cartão.',
  },
  faqIntro: {
    title: 'Dúvidas frequentes',
    text: 'As respostas mais comuns sobre nossos serviços. Se a sua dúvida depender de avaliação do seu estofado, fale com a gente no WhatsApp.',
  },
  blogIntro: {
    title: 'Conteúdo para cuidar melhor dos seus estofados',
    text: 'Artigos práticos sobre higienização, conservação e o que avaliar antes de contratar um serviço.',
  },
  contactIntro: {
    title: 'Fale com a gente',
    text: 'Atendimento a domicílio em Goiânia e região. Chame no WhatsApp, mande uma mensagem no Instagram ou solicite o agendamento pelo site.',
  },
  ctaBar: {
    text: 'Quer um orçamento rápido?',
    button: 'Chamar no WhatsApp',
  },
  sectionsOrder: [
    { id: 'servicos', visible: true },
    { id: 'resultados', visible: true },
    { id: 'como-funciona', visible: true },
    { id: 'diferenciais', visible: true },
    { id: 'agendamento', visible: true },
    { id: 'duvidas', visible: true },
    // O blog virou página separada (/blog) — não é mais uma seção da página inicial.
    { id: 'contato', visible: true },
  ],
  seo: {
    metaTitle: 'JC Lavagem a Seco | Higienização de estofados em Goiânia',
    metaDescription:
      'Higienização a domicílio de sofás, colchões, cadeiras, carrinhos de bebê e bancos de carro em Goiânia. Peça seu orçamento pelo WhatsApp (62) 99157-9369.',
    keywords: [
      'lavagem a seco goiânia',
      'higienização de sofá goiânia',
      'limpeza de colchão goiânia',
      'higienização de carrinho de bebê',
      'limpeza de bancos de carro',
      'impermeabilização de estofados goiânia',
    ],
  },
};

/** Lê o conteúdo publicado (merge chave a chave com defaults). Nunca lança: se o banco falhar/estiver vazio, usa os defaults. */
export async function getSiteData(): Promise<SiteData> {
  const out: SiteData = JSON.parse(JSON.stringify(DEFAULT_SITE));
  try {
    const rows = await db.siteContent.findMany();
    for (const row of rows) {
      if (!row.value) continue;
      try {
        const parsed = JSON.parse(row.value);
        const key = row.key as keyof SiteData;
        if (out[key] && typeof out[key] === 'object') {
          // substitui raso (objetos simples e arrays inteiros)
          out[key] = { ...(out[key] as object), ...parsed } as never;
        }
      } catch {
        // valor corrompido: mantém default
      }
    }
  } catch (e) {
    console.error('[site-content] banco indisponível — usando defaults:', e);
  }
  return out;
}

export async function getPublishedValue(key: string): Promise<Record<string, unknown> | null> {
  const row = await db.siteContent.findUnique({ where: { key } });
  if (!row?.value) return null;
  try {
    return JSON.parse(row.value);
  } catch {
    return null;
  }
}
