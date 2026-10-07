import 'server-only';
import { db } from '@/lib/db';
import { formatPhoneBR } from '@/lib/whatsapp';
import { contactFromContent } from '@/lib/public-config';
import { summarizePaymentNames } from '@/lib/payments';

/**
 * Motor do chatbot: correspondência por palavras-chave sobre a base de FAQ.
 * Sem dependência de API paga — 100% funcional offline.
 * Se nenhuma entrada corresponder com confiança, opcionalmente usa LLM
 * (z-ai-web-dev-sdk, apenas no servidor) restrito ao conteúdo aprovado.
 */

export type ChatAnswer = {
  answer: string;
  matchedFaqId: string | null;
  source: 'faq' | 'llm' | 'fallback';
  suggestions: string[];
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function resolveDynamic(answer: string): Promise<string> {
  if (answer.includes('DINAMICO_PAGAMENTOS')) {
    try {
      const methods = await db.paymentMethod.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } });
      const list = summarizePaymentNames(methods.map((m) => m.name)).join(', ');
      return list
        ? answer.replace('DINAMICO_PAGAMENTOS', `Trabalhamos com: ${list}. Confirmamos a forma de pagamento no atendimento.`)
        : 'As formas de pagamento estão sendo atualizadas — consulte pelo WhatsApp (62) 99157-9369.';
    } catch {
      return 'Sobre formas de pagamento, fale com a gente no WhatsApp (62) 99157-9369 que respondemos rapidinho.';
    }
  }
  return answer;
}

/** Pontua cada FAQ para a mensagem do usuário. */
function scoreFaq(message: string, faq: { question: string; keywords: string }): number {
  const msg = normalize(message);
  const msgWords = new Set(msg.split(' ').filter((w) => w.length > 2));
  let score = 0;
  const kws = faq.keywords.split(',').map((k) => normalize(k)).filter(Boolean);
  for (const kw of kws) {
    if (msg.includes(kw)) score += kw.includes(' ') ? 3 : 2;
    else {
      const kwWords = kw.split(' ').filter((w) => w.length > 2);
      const hits = kwWords.filter((w) => msgWords.has(w)).length;
      if (hits > 0) score += hits;
    }
  }
  const q = normalize(faq.question);
  if (q && msg.includes(q)) score += 4;
  return score;
}

const FALLBACK_ANSWER =
  'Essa eu não sei responder com certeza — e prefiro não chutar. 🙂 A JC Lavagem a Seco responde rápido no WhatsApp: (62) 99157-9369. Lá alguém do time resolve para você!';

export async function answerQuestion(sessionId: string, message: string): Promise<ChatAnswer> {
  const conversation = await db.chatConversation.create({ data: { sessionId } });
  await db.chatMessage.create({ data: { conversationId: conversation.id, role: 'user', content: message } });

  const faqs = await db.chatFaq.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } });

  let best: { faq: (typeof faqs)[number]; score: number } | null = null;
  for (const faq of faqs) {
    const score = scoreFaq(message, faq);
    if (!best || score > best.score) best = { faq, score };
  }

  if (best && best.score >= 2) {
    const answer = await resolveDynamic(best.faq.answer);
    await db.chatMessage.create({
      data: { conversationId: conversation.id, role: 'assistant', content: answer, matchedFaqId: best.faq.id },
    });
    await db.chatConversation.update({ where: { id: conversation.id }, data: { lastAt: new Date() } });
    return {
      answer,
      matchedFaqId: best.faq.id,
      source: 'faq',
      suggestions: suggestionsFor(faqs, best.faq.id),
    };
  }

  // Sem correspondência: tenta LLM restrito (opcional); se indisponível, fallback honesto
  const llm = await tryLlm(message, faqs).catch(() => null);
  const answer = llm ?? FALLBACK_ANSWER;
  await db.chatMessage.create({ data: { conversationId: conversation.id, role: 'assistant', content: answer } });
  await db.chatConversation.update({ where: { id: conversation.id }, data: { lastAt: new Date() } });
  return {
    answer,
    matchedFaqId: null,
    source: llm ? 'llm' : 'fallback',
    suggestions: suggestionsFor(faqs, null),
  };
}

function suggestionsFor(faqs: { id: string; question: string; showOnSite: boolean }[], excludeId: string | null): string[] {
  const base = faqs.filter((f) => f.showOnSite && f.id !== excludeId).slice(0, 6).map((f) => f.question);
  return base.length ? base : ['Quais serviços vocês oferecem?', 'Quanto custa? Como pedir orçamento?'];
}

/** LLM opcional, restrito ao conteúdo aprovado. Nunca expõe chaves no cliente. */
async function tryLlm(message: string, faqs: { question: string; answer: string }[]): Promise<string | null> {
  try {
    const { default: ZAI } = await import('z-ai-web-dev-sdk');
    const zai = await ZAI.create();
    const contact = await contactFromContent();
    const kb = faqs.map((f) => `P: ${f.question}\nR: ${f.answer}`).join('\n\n');
    const system = [
      'Você é o assistente virtual da JC Lavagem a Seco, empresa de higienização de estofados a domicílio em Goiânia-GO.',
      'Responda APENAS com base na base de conhecimento abaixo, em português brasileiro, de forma breve e natural (máx. 3 frases).',
      'REGRAS INEGOCIÁVEIS:',
      `- Nunca invente preços, horários exatos de secagem, disponibilidade, garantias, números de clientes ou avaliações.`,
      '- Não prometa eliminação de 100% de ácaros, bactérias ou vírus; não garanta remoção de qualquer mancha.',
      '- Não recomende produtos ou desmontagem de itens infantis; remeta ao manual do fabricante.',
      '- Se a resposta não estiver na base de conhecimento, diga que não sabe e sugira o WhatsApp.',
      `- Contato: WhatsApp ${formatPhoneBR(contact.whatsappIntl)}. Endereço: ${contact.addressStreet}, ${contact.addressDistrict}, ${contact.addressCity}-${contact.addressState}.`,
      '',
      'BASE DE CONHECIMENTO APROVADA:',
      kb,
    ].join('\n');

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: system },
        { role: 'user', content: message },
      ],
      thinking: { type: 'disabled' },
    });
    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) return null;
    return content.slice(0, 700);
  } catch {
    return null;
  }
}
