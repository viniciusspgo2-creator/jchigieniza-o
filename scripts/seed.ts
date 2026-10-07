/**
 * Seed inicial do sistema JC Lavagem a Seco.
 * Idempotente: só insere o que ainda não existe.
 * Executar: bun scripts/seed.ts
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';

const db = new PrismaClient();

// ---------- categorias de serviços ----------
const CATEGORIES = [
  { name: 'Casa e conforto', slug: 'casa-e-conforto', icon: 'armchair', sortOrder: 1, description: 'Sofás, colchões, cadeiras, poltronas, puffs e tapetes da sua casa.' },
  { name: 'Cuidados com itens infantis', slug: 'itens-infantis', icon: 'baby', sortOrder: 2, description: 'Carrinhos, bebê conforto e pelúcias, com cuidado redobrado.' },
  { name: 'Interior veicular', slug: 'interior-veicular', icon: 'car', sortOrder: 3, description: 'Bancos, carpetes e interior do carro com técnica adequada.' },
  { name: 'Proteção de estofados', slug: 'protecao-de-estofados', icon: 'shield', sortOrder: 4, description: 'Impermeabilização e lavagem a seco para conservar seus estofados.' },
];

const SERVICES: { cat: string; name: string; slug: string; description: string; durationMin: number; whatsappMsg: string; sortOrder: number }[] = [
  { cat: 'casa-e-conforto', name: 'Higienização de sofás', slug: 'higienizacao-de-sofas', description: 'Higienização completa do sofá com avaliação do tecido, tratamento de manchas e extração controlada de umidade.', durationMin: 120, whatsappMsg: 'Olá! Gostaria de um orçamento para *Higienização de sofá*. É um sofá de quantos lugares?', sortOrder: 1 },
  { cat: 'casa-e-conforto', name: 'Colchões e camas box', slug: 'colchoes-e-camas-box', description: 'Higienização de colchões e camas box, removendo manchas de suor e resíduos acumulados com o tempo.', durationMin: 120, whatsappMsg: 'Olá! Gostaria de um orçamento para *Higienização de colchão*. É casal ou de solteiro?', sortOrder: 2 },
  { cat: 'casa-e-conforto', name: 'Cadeiras e poltronas', slug: 'cadeiras-e-poltronas', description: 'Limpeza de cadeiras de jantar, poltronas de sala e escritório, com técnica adequada a cada tecido.', durationMin: 90, whatsappMsg: 'Olá! Gostaria de um orçamento para *Higienização de cadeiras/poltronas*. Quantas peças?', sortOrder: 3 },
  { cat: 'casa-e-conforto', name: 'Puffs', slug: 'puffs', description: 'Higienização de puffs e banquetas estofadas, com produtos adequados ao material.', durationMin: 60, whatsappMsg: 'Olá! Gostaria de um orçamento para *Higienização de puff(s)*.', sortOrder: 4 },
  { cat: 'casa-e-conforto', name: 'Tapetes e carpetes', slug: 'tapetes-e-carpetes', description: 'Higienização de tapetes e carpetes, incluindo remoção de manchas e odores acumulados.', durationMin: 120, whatsappMsg: 'Olá! Gostaria de um orçamento para *Higienização de tapete/carpete*. Qual o tamanho aproximado?', sortOrder: 5 },
  { cat: 'itens-infantis', name: 'Carrinhos de bebê', slug: 'carrinhos-de-bebe', description: 'Higienização de carrinhos de bebê respeitando as instruções do fabricante e os componentes de segurança.', durationMin: 90, whatsappMsg: 'Olá! Gostaria de um orçamento para *Higienização de carrinho de bebê*.', sortOrder: 1 },
  { cat: 'itens-infantis', name: 'Bebê conforto', slug: 'bebe-conforto', description: 'Higienização de bebê conforto e cadeirinhas, com extração controlada e cuidado com cintos e engates.', durationMin: 90, whatsappMsg: 'Olá! Gostaria de um orçamento para *Higienização de bebê conforto/cadeirinha*.', sortOrder: 2 },
  { cat: 'itens-infantis', name: 'Ursos de pelúcia', slug: 'ursos-de-pelucia', description: 'Higienização de ursos e brinquedos de pelúcia com produtos adequados e secagem cuidadosa.', durationMin: 60, whatsappMsg: 'Olá! Gostaria de um orçamento para *Higienização de ursos de pelúcia*.', sortOrder: 3 },
  { cat: 'interior-veicular', name: 'Bancos de carro e interior veicular', slug: 'bancos-de-carro-e-interior-veicular', description: 'Higienização de bancos de tecido ou couro, carpetes e interior do veículo, no seu endereço.', durationMin: 150, whatsappMsg: 'Olá! Gostaria de um orçamento para *Higienização de bancos e interior do carro*. Qual o modelo do veículo?', sortOrder: 1 },
  { cat: 'interior-veicular', name: 'Lavagem de carro', slug: 'lavagem-de-carro', description: 'Lavagem do veículo com cuidado com a pintura e acabamento interno.', durationMin: 90, whatsappMsg: 'Olá! Gostaria de um orçamento para *Lavagem de carro*.', sortOrder: 2 },
  { cat: 'protecao-de-estofados', name: 'Impermeabilização de estofados', slug: 'impermeabilizacao-de-estofados', description: 'Aplicação de agente protetor que retarda a absorção de líquidos e facilita a limpeza do dia a dia.', durationMin: 120, whatsappMsg: 'Olá! Gostaria de um orçamento para *Impermeabilização de estofado*.', sortOrder: 1 },
  { cat: 'protecao-de-estofados', name: 'Lavagem a seco', slug: 'lavagem-a-seco', description: 'Técnica com menor volume de umidade para estofados que exigem cuidado especial — avaliamos o tecido antes de indicar.', durationMin: 120, whatsappMsg: 'Olá! Gostaria de um orçamento para *Lavagem a seco* de estofado.', sortOrder: 2 },
];

// ---------- FAQ / base do chatbot ----------
const FAQS = [
  { q: 'Quais serviços vocês oferecem?', a: 'Higienizamos sofás, colchões e camas box, cadeiras e poltronas, puffs, tapetes e carpetes, carrinhos de bebê, bebê conforto, ursos de pelúcia, bancos de carro e interior veicular, além de impermeabilização de estofados e lavagem a seco. Cada serviço começa pela avaliação do item.', k: 'serviços, serviço, oferecem, fazem, higienização, limpeza, sofá, colchão, tapete, carro', site: true },
  { q: 'O atendimento é a domicílio?', a: 'Sim, o atendimento é a domicílio em Goiânia: levamos equipamento e produtos até o seu endereço. A disponibilidade para o seu bairro é confirmada no agendamento.', k: 'domicílio, domicilio, em casa, a casa, vão até, deslocamento, onde atendem', site: true },
  { q: 'Onde vocês ficam localizados?', a: 'Estamos no Setor Morada do Sol, em Goiânia (Rua Sulamita, Quadra 02, Lote 38, CEP 74475-180). Como o atendimento é a domicílio, basta solicitar e a gente vai até você.', k: 'localização, localizacao, endereço, endereco, onde ficam, onde vocês, morada do sol, goiânia', site: true },
  { q: 'Quanto custa? Como pedir orçamento?', a: 'O orçamento depende do item, do tamanho, do tecido e das condições — por isso é personalizado. O jeito mais rápido é chamar no WhatsApp (62) 99157-9369 descrevendo o item (pode mandar fotos). Respondemos com a avaliação.', k: 'preço, preco, quanto custa, orçamento, orcamento, valor, caro, barato, quanto sai', site: true },
  { q: 'Como funciona o agendamento?', a: 'Você pode solicitar pelo formulário do site (seção Agendamento) ou pelo WhatsApp. Enviar a solicitação não confirma automaticamente: a gente avalia o serviço e confirma o horário com você.', k: 'agendamento, agendar, marcar, horário, horario, data, disponibilidade, agenda', site: true },
  { q: 'Como devo preparar o ambiente para o atendimento?', a: 'Dicas simples: retire objetos pessoais e eletrônicos do entorno do estofado, libere o acesso ao local e, se possível, deixe o ambiente ventilado. O restante fica por nossa conta.', k: 'preparar, preparação, preparacao, antes do atendimento, preciso fazer o que, arrumar', site: true },
  { q: 'Quanto tempo demora para o estofado secar?', a: 'A secagem varia com a técnica aplicada, o tipo de tecido, a ventilação e a umidade do dia — por isso não damos um número fixo. No dia do atendimento orientamos exatamente como acelerar a secagem e quando o item pode ser usado novamente.', k: 'seca, secagem, secar, molhado, umidade, quanto tempo demora secar, usar depois', site: true },
  { q: 'Quais são as formas de pagamento?', a: 'DINAMICO_PAGAMENTOS', k: 'pagamento, pagar, pix, cartão, cartao, dinheiro, dinheiro, crédito, debito, formas de pagamento', site: true },
  { q: 'A lavagem a seco não molha o estofado?', a: 'Apesar do nome, a "lavagem a seco" não significa ausência total de umidade: são técnicas com menor volume de líquido, indicadas conforme o tecido e as condições do item. A avaliação prévia define o melhor método e as orientações de secagem.', k: 'a seco, seco, sem água, sem agua, não molha, nao molha, molha', site: true },
  { q: 'Vocês lavam roupas?', a: 'Não. Nosso foco é a higienização de estofados em geral (sofás, colchões, cadeiras, tapetes, itens infantis e interior veicular). Não trabalhamos com lavanderia de roupas.', k: 'roupas, lavanderia, lavar roupa, camisa, calça, calca, edredom, cortina', site: true },
  { q: 'A impermeabilização garante que o estofado não mancha?', a: 'A impermeabilização cria uma barreira que retarda a absorção de líquidos e facilita a limpeza, mas não torna o estofado à prova de manchas. Líquidos deixados por muito tempo ou substâncias oleosas podem fixar. Explicamos os limites no atendimento.', k: 'impermeabilização, impermeabilizacao, proteção, protecao, mancha, à prova, a prova', site: true },
  { q: 'Posso falar com uma pessoa?', a: 'Claro! Se preferir conversar com alguém do time, é só chamar no WhatsApp (62) 99157-9369 — atendimento humano, direto com quem executa o serviço.', k: 'pessoa, humano, atender, falar com alguém, falar com alguem, atendente, ligação, ligacao', site: true },
  { q: 'Quanto tempo dura o atendimento?', a: 'Depende do serviço e da quantidade de itens: um sofá costuma levar cerca de 2 horas, bancos de carro um pouco mais. A duração estimada é informada na avaliação e pode variar com as condições do item.', k: 'quanto tempo, duração, duracao, demora, leva', site: false },
  { q: 'Vocês emitem recibo?', a: 'Sim, solicitamos e registramos cada atendimento — se precisar de recibo, é só pedir no WhatsApp ou informar no momento do agendamento.', k: 'recibo, nota, comprovante, fiscal', site: false },
  { q: 'Preciso tirar os tecidos do carrinho/bebê conforto antes?', a: 'Não recomendamos desmontar nada além do que o manual do fabricante autoriza — alguns componentes fazem parte do sistema de segurança. No atendimento avaliamos o modelo e cuidamos da limpeza do jeito certo.', k: 'desmontar, tirar tecido, removível, removivel, peças, pecas, manual do fabricante', site: false },
];

// ---------- galeria (somente fotos reais sem marca de terceiros) ----------
const GALLERY = [
  { title: 'Sofá de 2 lugares em tecido cinza', cat: 'casa', image: '/img/obras/sofa-cinza-depois.webp', before: '/img/obras/sofa-cinza-antes.webp', after: '/img/obras/sofa-cinza-depois.webp', comparator: true, desc: 'Remoção de manchas antigas no assento e respaldo.', alt: 'Sofá cinza antes e depois da higienização profissional' },
  { title: 'Sofá bege com manchas antigas', cat: 'casa', image: '/img/obras/sofa-bege-depois.webp', before: '/img/obras/sofa-bege-antes.webp', after: '/img/obras/sofa-bege-depois.webp', comparator: true, desc: 'Higienização profunda com tratamento de manchas de uso diário.', alt: 'Sofá bege antes e depois da higienização, com manchas removidas' },
  { title: 'Colchão de casal', cat: 'casa', image: '/img/obras/colchao-depois.webp', before: '/img/obras/colchao-antes.webp', after: '/img/obras/colchao-depois.webp', comparator: true, desc: 'Remoção de manchas amareladas de suor acumulado.', alt: 'Colchão antes e depois da higienização profissional' },
  { title: 'Cadeiras de jantar', cat: 'casa', image: '/img/obras/cadeiras-jantar-depois.webp', before: '/img/obras/cadeiras-jantar-antes.webp', after: '/img/obras/cadeiras-jantar-depois.webp', comparator: true, desc: 'Tecido clareado e livre da sujeira acumulada do uso diário.', alt: 'Cadeiras de jantar estofadas antes e depois da higienização' },
  { title: 'Banco dianteiro do carro', cat: 'veicular', image: '/img/obras/banco-carro-depois.webp', before: '/img/obras/banco-carro-antes.webp', after: '/img/obras/banco-carro-depois.webp', comparator: true, desc: 'Interior veicular com remoção de manchas incrustadas no tecido.', alt: 'Banco de carro antes e depois da higienização' },
  { title: 'Bebê conforto', cat: 'infantil', image: '/img/obras/bebe-conforto-comparativo.webp', desc: 'Higienização respeitando o manual do fabricante e os componentes de segurança.', alt: 'Bebê conforto vermelho antes e depois da higienização' },
  { title: 'Carrinho de bebê', cat: 'infantil', image: '/img/obras/carrinho-bebe-comparativo.webp', desc: 'Tecidos limpos com extração controlada, sem desmontar componentes de segurança.', alt: 'Carrinho de bebê antes e depois da higienização' },
  { title: 'Banco traseiro do carro', cat: 'veicular', image: '/img/obras/banco-carro-traseiro-comparativo.webp', desc: 'Remoção de manchas generalizadas no banco traseiro.', alt: 'Banco traseiro de carro antes e depois da higienização' },
  { title: 'Sofá retrátil e reclinável', cat: 'casa', image: '/img/obras/sofa-retratil-depois.webp', desc: 'Sofá de canto retrátil com higienização completa dos assentos.', alt: 'Sofá retrátil de canto limpo após higienização' },
];

async function seedPosts() {
  const dir = path.join(process.cwd(), 'content', 'blog');
  const files = readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
  for (const file of files) {
    const raw = readFileSync(path.join(dir, file), 'utf-8');
    const parts = raw.split(/^---\s*$/m);
    const header = parts[0].trim();
    const content = parts.slice(1).join('---').trim();
    const meta: Record<string, string> = {};
    for (const line of header.split('\n')) {
      const m = line.match(/^(\w+):\s*(.+)$/);
      if (m) meta[m[1]] = m[2].trim();
    }
    const slug = meta.slug;
    if (!slug) throw new Error(`Artigo sem slug: ${file}`);
    const exists = await db.post.findUnique({ where: { slug } });
    if (exists) {
      // mantém edição manual posterior; só garante publicado
      continue;
    }
    const now = new Date();
    await db.post.create({
      data: {
        title: meta.title,
        slug,
        excerpt: meta.excerpt,
        content,
        metaTitle: meta.metaTitle || meta.title,
        metaDescription: meta.metaDescription || meta.excerpt,
        coverImage: meta.coverImage,
        coverAlt: meta.coverAlt || meta.title,
        authorName: meta.authorName || 'Equipe JC Lavagem a Seco',
        status: 'PUBLISHED',
        publishedAt: now,
      },
    });
    console.log('post criado:', slug);
  }
}

async function main() {
  console.log('— Seed JC Lavagem a Seco —');

  // Serviços
  for (const c of CATEGORIES) {
    await db.serviceCategory.upsert({
      where: { slug: c.slug },
      update: {},
      create: { ...c },
    });
  }
  const cats = await db.serviceCategory.findMany();
  const catMap = new Map(cats.map((c) => [c.slug, c.id]));
  for (const s of SERVICES) {
    await db.service.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        categoryId: catMap.get(s.cat)!,
        name: s.name,
        slug: s.slug,
        description: s.description,
        durationMin: s.durationMin,
        whatsappMsg: s.whatsappMsg,
        sortOrder: s.sortOrder,
      },
    });
  }
  console.log('serviços ok');

  // FAQ
  const faqCount = await db.chatFaq.count();
  if (faqCount === 0) {
    let i = 0;
    for (const f of FAQS) {
      await db.chatFaq.create({
        data: { question: f.q, answer: f.a, keywords: f.k, showOnSite: f.site, sortOrder: i++ },
      });
    }
    console.log('faq ok');
  } else {
    console.log('faq já existia, mantido');
  }

  // Galeria
  const galCount = await db.galleryItem.count();
  if (galCount === 0) {
    let i = 0;
    for (const g of GALLERY) {
      await db.galleryItem.create({
        data: {
          title: g.title,
          description: g.desc,
          category: g.cat,
          image: g.image,
          imageAlt: g.alt,
          beforeImage: g.before ?? null,
          afterImage: g.after ?? null,
          isComparator: g.comparator,
          sortOrder: i++,
        },
      });
    }
    console.log('galeria ok');
  }

  // Horários de atendimento: seg-sáb 8h-18h, janelas de 2h, capacidade 1; domingo fechado
  const bhCount = await db.businessHours.count();
  if (bhCount === 0) {
    for (let wd = 0; wd <= 6; wd++) {
      await db.businessHours.create({
        data: {
          weekday: wd,
          active: wd >= 1 && wd <= 6,
          openTime: '08:00',
          closeTime: '18:00',
          slotMinutes: 120,
          capacityPerSlot: 1,
        },
      });
    }
    console.log('horários ok');
  }

  // Financeiro: formas de pagamento, categorias e contas
  const pmCount = await db.paymentMethod.count();
  if (pmCount === 0) {
    for (const [i, p] of ['PIX', 'Dinheiro', 'Cartão de débito', 'Cartão de crédito'].entries()) {
      await db.paymentMethod.create({ data: { name: p, sortOrder: i } });
    }
    console.log('formas de pagamento ok');
  }
  const fcCount = await db.financialCategory.count();
  if (fcCount === 0) {
    const incomes = ['Serviços a domicílio'];
    const expenses = ['Insumos e produtos', 'Transporte e combustível', 'Equipamentos e manutenção', 'Marketing', 'Outras despesas'];
    for (const n of incomes) await db.financialCategory.create({ data: { name: n, type: 'INCOME' } });
    for (const n of expenses) await db.financialCategory.create({ data: { name: n, type: 'EXPENSE' } });
    console.log('categorias financeiras ok');
  }
  const faCount = await db.financialAccount.count();
  if (faCount === 0) {
    for (const [i, a] of [['Caixa', 'CAIXA'], ['PIX', 'PIX']].entries()) {
      await db.financialAccount.create({ data: { name: a[0], type: a[1] } });
    }
    console.log('contas financeiras ok');
  }

  // Artigos do blog
  await seedPosts();

  const counts = {
    services: await db.service.count(),
    faqs: await db.chatFaq.count(),
    gallery: await db.galleryItem.count(),
    posts: await db.post.count(),
    users: await db.user.count(),
  };
  console.log('resumo:', counts);
  if (counts.users === 0) {
    console.log('AVISO: nenhum administrador criado ainda. Use /admin/setup com ADMIN_SETUP_TOKEN do .env');
  }
}

main().finally(() => db.$disconnect());
